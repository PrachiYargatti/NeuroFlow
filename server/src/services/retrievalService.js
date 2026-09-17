import { getRepository } from '../data/repository.js';
import { embedText } from './ollamaService.js';

function tokenize(text) {
  return new Set(String(text || '').toLowerCase().match(/[a-z0-9]{2,}/g) || []);
}

function cosine(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

function keywordScore(query, text) {
  const queryTerms = tokenize(query);
  const textTerms = tokenize(text);
  if (!queryTerms.size) return 0;
  let overlap = 0;
  for (const term of queryTerms) {
    if (textTerms.has(term)) overlap += 1;
  }
  return overlap / queryTerms.size;
}

export async function retrieveChunks(userId, workspaceId, query, options = {}) {
  const repository = getRepository();
  const filter = { userId, workspaceId };
  let chunks = await repository.getAll('document_chunks', filter);
  if (options.documentIds?.length) {
    chunks = chunks.filter((chunk) => options.documentIds.includes(chunk.documentId));
  }

  const queryEmbedding = await embedText(query);
  const documents = await repository.getAll('documents', { userId, workspaceId });
  const documentNames = new Map(documents.map((doc) => [doc.id, doc.originalName]));

  return chunks
    .map((chunk) => {
      const hasEmbedding = queryEmbedding.length && chunk.embedding?.length;
      const score = hasEmbedding ? cosine(queryEmbedding, chunk.embedding) : keywordScore(query, chunk.text);
      return {
        documentId: chunk.documentId,
        documentName: documentNames.get(chunk.documentId) || chunk.metadata?.documentName || 'Document',
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        snippet: chunk.text.slice(0, 260),
        score
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, options.topK || 5);
}
