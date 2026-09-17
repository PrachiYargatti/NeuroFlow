import {
  createUploadedDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  reprocessDocument
} from '../services/documentService.js';

export async function index(req, res) {
  res.json({ documents: await listDocuments(req.user.id, req.params.workspaceId) });
}

export async function uploadDocument(req, res) {
  const document = await createUploadedDocument(req.user.id, req.params.workspaceId, req.file);
  res.status(201).json({ document });
}

export async function show(req, res) {
  res.json({ document: await getDocument(req.user.id, req.params.id) });
}

export async function reprocess(req, res) {
  res.json({ document: await reprocessDocument(req.user.id, req.params.id) });
}

export async function destroy(req, res) {
  await deleteDocument(req.user.id, req.params.id);
  res.status(204).end();
}
