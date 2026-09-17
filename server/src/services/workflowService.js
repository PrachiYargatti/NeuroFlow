import { getRepository } from '../data/repository.js';
import { httpError } from '../utils/httpError.js';
import { chatJson } from './ollamaService.js';
import { retrieveChunks } from './retrievalService.js';
import { getWorkspace } from './workspaceService.js';

const workflowTitles = {
  ask: 'Ask workspace',
  summarize: 'Summarize workspace',
  compare: 'Compare documents',
  meeting_action_items: 'Meeting action items',
  research_brief: 'Research brief'
};

function citationFromChunk(chunk) {
  return {
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    chunkIndex: chunk.chunkIndex,
    snippet: chunk.snippet,
    score: Number(chunk.score.toFixed(3))
  };
}

function sentenceList(text, limit = 5) {
  return String(text || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .map(stripSourcePrefix)
    .filter((item) => item.length > 20)
    .slice(0, limit);
}

function contextText(chunks) {
  return chunks.map((chunk) => `[${chunk.documentName}] ${chunk.text}`).join('\n\n');
}

function stripSourcePrefix(text) {
  return String(text || '')
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/^[^:]{1,120}:\s*/, '')
    .trim();
}

function normalizeQuestion(text) {
  return String(text || '').toLowerCase();
}

function isDefinitionQuestion(question) {
  return /\b(define|definition|meaning|what is|what are|explain)\b/.test(normalizeQuestion(question));
}

function importantTerms(question) {
  const stopWords = new Set([
    'give',
    'the',
    'me',
    'of',
    'for',
    'what',
    'is',
    'are',
    'define',
    'definition',
    'meaning',
    'explain',
    'please',
    'tell',
    'about'
  ]);
  return normalizeQuestion(question)
    .match(/[a-z0-9]{2,}/g)
    ?.filter((term) => !stopWords.has(term)) || [];
}

function scoreSentence(sentence, terms) {
  const normalized = normalizeQuestion(sentence);
  let score = 0;
  for (const term of terms) {
    if (normalized.includes(term)) score += 2;
  }
  if (/\b(is|means|refers to|defined as|branch of|can create)\b/.test(normalized)) score += 2;
  return score;
}

function composeAskAnswer(question, chunks) {
  if (!chunks.length) {
    return 'No ready document content was found for this question.';
  }

  const sentences = sentenceList(contextText(chunks), 20);
  const terms = importantTerms(question);
  const ranked = sentences
    .map((sentence) => ({ sentence, score: scoreSentence(sentence, terms) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]?.sentence;
  if (isDefinitionQuestion(question) && best) {
    const cleaned = best
      .replace(/^\d+\.?\s*/, '')
      .replace(/^Definition\s+/i, '')
      .trim();
    return cleaned.endsWith('.') ? cleaned : `${cleaned}.`;
  }

  return ranked
    .filter((item) => item.score > 0)
    .slice(0, 3)
    .map((item) => item.sentence)
    .join(' ') || sentences.slice(0, 3).join(' ');
}

function fallbackOutput(type, input, chunks) {
  const context = contextText(chunks);
  const sentences = sentenceList(context, 8);

  if (type === 'ask') {
    return { answer: composeAskAnswer(input.question || input.prompt || '', chunks) };
  }

  if (type === 'summarize') {
    return {
      summary: sentences.slice(0, 3).join(' ') || 'No ready document content is available to summarize.',
      keyPoints: sentences.slice(0, 5)
    };
  }

  if (type === 'compare') {
    const byDoc = new Map();
    for (const chunk of chunks) {
      if (!byDoc.has(chunk.documentId)) byDoc.set(chunk.documentId, []);
      byDoc.get(chunk.documentId).push(chunk);
    }
    return {
      overview: 'Comparison generated from retrieved document chunks.',
      similarities: ['Documents were compared using overlapping retrieved content and keywords.'],
      differences: Array.from(byDoc.values()).map((items) => `${items[0].documentName}: ${items[0].snippet}`),
      documentTakeaways: Array.from(byDoc.entries()).map(([documentId, items]) => ({
        documentId,
        documentName: items[0].documentName,
        takeaway: items[0].snippet
      }))
    };
  }

  if (type === 'meeting_action_items') {
    const actionLines = context
      .split(/\n+/)
      .filter((line) => /\b(todo|action|follow up|must|should|need to|assign|owner)\b/i.test(line))
      .slice(0, 8);
    return {
      summary: sentences.slice(0, 2).join(' ') || 'Action item extraction completed.',
      actionItems: (actionLines.length ? actionLines : sentences.slice(0, 3)).map((line) => ({
        task: line.slice(0, 180),
        owner: 'Unassigned',
        priority: 'medium',
        dueNote: 'Not specified'
      }))
    };
  }

  return {
    title: input.topic || 'Research brief',
    executiveSummary: sentences.slice(0, 3).join(' ') || 'No ready document content is available for a research brief.',
    themes: [
      { heading: 'Key evidence', details: sentences.slice(0, 3) },
      { heading: 'Supporting context', details: sentences.slice(3, 6) }
    ],
    conclusion: sentences[6] || 'Review more uploaded documents to strengthen this brief.'
  };
}

function outputShape(type) {
  if (type === 'ask') return { answer: '' };
  if (type === 'summarize') return { summary: '', keyPoints: [] };
  if (type === 'compare') return { overview: '', similarities: [], differences: [], documentTakeaways: [] };
  if (type === 'meeting_action_items') return { summary: '', actionItems: [] };
  return { title: '', executiveSummary: '', themes: [], conclusion: '' };
}

export async function runWorkflow(userId, workspaceId, type, input = {}) {
  await getWorkspace(userId, workspaceId);
  if (type === 'compare' && (!Array.isArray(input.documentIds) || input.documentIds.length < 2)) {
    throw httpError(400, 'Compare requires at least 2 documents');
  }

  const repository = getRepository();
  const run = await repository.create('workflow_runs', {
    userId,
    workspaceId,
    type,
    status: 'queued',
    title: workflowTitles[type],
    input,
    output: {},
    citations: [],
    evaluation: {},
    trace: [{ stage: 'queued', status: 'completed', note: 'Workflow run created.' }]
  });

  const trace = [...run.trace, { stage: 'Planner', status: 'completed', note: 'Created retrieval plan.' }];
  await repository.updateById('workflow_runs', run.id, { status: 'running', trace });

  const query = input.question || input.prompt || input.topic || workflowTitles[type];
  const chunks = await retrieveChunks(userId, workspaceId, query, { documentIds: input.documentIds, topK: 5 });
  trace.push({ stage: 'Retriever', status: 'completed', note: `Retrieved ${chunks.length} chunks.` });

  const fallback = fallbackOutput(type, input, chunks);
  const prompt = [
    `Return JSON matching this shape: ${JSON.stringify(outputShape(type))}`,
    `Workflow type: ${type}`,
    `Input: ${JSON.stringify(input)}`,
    `Context:\n${contextText(chunks)}`
  ].join('\n\n');
  const rawOutput = await chatJson(prompt, fallback);
  trace.push({ stage: 'Task', status: 'completed', note: 'Generated workflow content.' });

  const output = { ...fallback, ...rawOutput };
  trace.push({ stage: 'Writer', status: 'completed', note: 'Normalized output JSON for the UI.' });

  const citations = chunks.map(citationFromChunk);
  const evaluation = {
    note: chunks.length ? 'Grounded in retrieved workspace chunks.' : 'No matching ready chunks were available.',
    confidence: chunks.length >= 3 ? 'high' : chunks.length ? 'medium' : 'low'
  };
  trace.push({ stage: 'Evaluator', status: 'completed', note: evaluation.note });

  return repository.updateById('workflow_runs', run.id, {
    status: 'completed',
    output,
    citations,
    evaluation,
    trace
  });
}

export async function listRuns(userId, workspaceId) {
  await getWorkspace(userId, workspaceId);
  return getRepository().getAll('workflow_runs', { userId, workspaceId }, { createdAt: -1 });
}

export async function getRun(userId, id) {
  const run = await getRepository().getOne('workflow_runs', { id, userId });
  if (!run) {
    throw httpError(404, 'Workflow run not found');
  }
  return run;
}

export async function askWorkspace(userId, workspaceId, input) {
  const repository = getRepository();
  const thread =
    input.threadId
      ? await repository.getOne('chat_threads', { id: input.threadId, userId, workspaceId })
      : await repository.create('chat_threads', {
          userId,
          workspaceId,
          title: String(input.question || 'Workspace chat').slice(0, 80)
        });

  if (!thread) {
    throw httpError(404, 'Chat thread not found');
  }

  await repository.create('chat_messages', {
    userId,
    workspaceId,
    threadId: thread.id,
    role: 'user',
    content: input.question,
    citations: []
  });

  const run = await runWorkflow(userId, workspaceId, 'ask', input);
  const assistant = await repository.create('chat_messages', {
    userId,
    workspaceId,
    threadId: thread.id,
    role: 'assistant',
    content: run.output.answer || '',
    citations: run.citations
  });

  return { thread, message: assistant, run };
}

export async function listThreads(userId, workspaceId) {
  await getWorkspace(userId, workspaceId);
  return getRepository().getAll('chat_threads', { userId, workspaceId }, { updatedAt: -1 });
}

export async function listMessages(userId, workspaceId, threadId) {
  return getRepository().getAll('chat_messages', { userId, workspaceId, threadId }, { createdAt: 1 });
}
