import fs from 'fs/promises';
import { getRepository } from '../data/repository.js';
import { extractText, cleanText, summarizeText } from './textExtractionService.js';
import { chunkText } from './chunkService.js';
import { embedText } from './ollamaService.js';
import { getWorkspace } from './workspaceService.js';
import { httpError } from '../utils/httpError.js';
import { inferFileType } from '../utils/fileTypes.js';

export async function listDocuments(userId, workspaceId) {
  await getWorkspace(userId, workspaceId);
  return getRepository().getAll('documents', { userId, workspaceId }, { createdAt: -1 });
}

export async function getDocument(userId, id) {
  const document = await getRepository().getOne('documents', { id, userId });
  if (!document) {
    throw httpError(404, 'Document not found');
  }
  return document;
}

export async function createUploadedDocument(userId, workspaceId, file) {
  await getWorkspace(userId, workspaceId);
  if (!file) {
    throw httpError(400, 'A file is required');
  }

  const repository = getRepository();
  const document = await repository.create('documents', {
    userId,
    workspaceId,
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype || 'application/octet-stream',
    size: file.size,
    fileType: file.fileType || inferFileType(file.originalname),
    status: 'uploaded',
    extractedText: '',
    summary: '',
    pageCount: 0,
    metadata: { path: file.path },
    processingError: ''
  });

  return processDocument(userId, document.id, file.path);
}

export async function processDocument(userId, documentId, explicitPath) {
  const repository = getRepository();
  const document = await getDocument(userId, documentId);
  const filePath = explicitPath || document.metadata?.path;

  await repository.updateById('documents', document.id, { status: 'processing', processingError: '' });
  await repository.deleteWhere('document_chunks', { userId, documentId: document.id });

  try {
    const extracted = await extractText(filePath, document.fileType);
    const text = cleanText(extracted.text);
    if (text.length < 10) {
      throw httpError(422, 'No readable text could be extracted from this file');
    }

    const summary = summarizeText(text);
    const chunks = chunkText(text);
    for (const chunk of chunks) {
      const embedding = await embedText(chunk.text);
      await repository.create('document_chunks', {
        userId,
        workspaceId: document.workspaceId,
        documentId: document.id,
        ...chunk,
        embedding,
        metadata: { ...chunk.metadata, documentName: document.originalName }
      });
    }

    return repository.updateById('documents', document.id, {
      status: 'ready',
      extractedText: text,
      summary,
      pageCount: extracted.pageCount || extracted.metadata?.pages || 0,
      metadata: { ...document.metadata, ...(extracted.metadata || {}) },
      processingError: ''
    });
  } catch (error) {
    return repository.updateById('documents', document.id, {
      status: 'failed',
      processingError: error.message || 'Document processing failed'
    });
  }
}

export async function reprocessDocument(userId, id) {
  const document = await getDocument(userId, id);
  return processDocument(userId, document.id);
}

export async function deleteDocument(userId, id) {
  const repository = getRepository();
  const document = await getDocument(userId, id);
  await repository.deleteWhere('document_chunks', { userId, documentId: id });
  await repository.deleteById('documents', id);
  if (document.metadata?.path) {
    await fs.unlink(document.metadata.path).catch(() => {});
  }
}
