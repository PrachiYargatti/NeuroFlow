import { Router } from 'express';
import { create, destroy, index, show, update } from '../controllers/workspaceController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const workspaceRoutes = Router();

workspaceRoutes.use(requireAuth);
workspaceRoutes.get('/', asyncHandler(index));
workspaceRoutes.post('/', asyncHandler(create));
workspaceRoutes.get('/:id', asyncHandler(show));
workspaceRoutes.patch('/:id', asyncHandler(update));
workspaceRoutes.delete('/:id', asyncHandler(destroy));
