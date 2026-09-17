import { env } from '../config/env.js';

async function postOllama(path, body) {
  const response = await fetch(`${env.ollamaBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(4000)
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  return response.json();
}

export async function chatJson(prompt, fallback) {
  try {
    const data = await postOllama('/api/generate', {
      model: env.ollamaChatModel,
      prompt,
      stream: false,
      format: 'json'
    });
    return JSON.parse(data.response);
  } catch (_error) {
    return fallback;
  }
}

export async function embedText(text) {
  try {
    const data = await postOllama('/api/embeddings', {
      model: env.ollamaEmbedModel,
      prompt: text
    });
    return Array.isArray(data.embedding) ? data.embedding : [];
  } catch (_error) {
    return [];
  }
}
