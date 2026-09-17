import { Router } from 'express';
import { destroy, index, reprocess, show, uploadDocument } from '../controllers/documentController.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const documentRoutes = Router();

documentRoutes.use(requireAuth);
documentRoutes.get('/workspaces/:workspaceId/documents', asyncHandler(index));
documentRoutes.post('/workspaces/:workspaceId/documents/upload', upload.single('file'), asyncHandler(uploadDocument));
documentRoutes.get('/documents/:id', asyncHandler(show));
documentRoutes.post('/documents/:id/reprocess', asyncHandler(reprocess));
documentRoutes.delete('/documents/:id', asyncHandler(destroy));
