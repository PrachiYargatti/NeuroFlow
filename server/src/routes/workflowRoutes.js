import { Router } from 'express';
import {
  actionItems,
  ask,
  compare,
  listWorkspaceRuns,
  messages,
  researchBrief,
  showRun,
  summarize,
  threads
} from '../controllers/workflowController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const workflowRoutes = Router();

workflowRoutes.use(requireAuth);
workflowRoutes.get('/workspaces/:workspaceId/chat', asyncHandler(threads));
workflowRoutes.get('/workspaces/:workspaceId/chat/:threadId/messages', asyncHandler(messages));
workflowRoutes.post('/workspaces/:workspaceId/chat', asyncHandler(ask));
workflowRoutes.get('/workspaces/:workspaceId/runs', asyncHandler(listWorkspaceRuns));
workflowRoutes.get('/runs/:id', asyncHandler(showRun));
workflowRoutes.post('/workspaces/:workspaceId/runs/summarize', asyncHandler(summarize));
workflowRoutes.post('/workspaces/:workspaceId/runs/compare', asyncHandler(compare));
workflowRoutes.post('/workspaces/:workspaceId/runs/meeting-action-items', asyncHandler(actionItems));
workflowRoutes.post('/workspaces/:workspaceId/runs/research-brief', asyncHandler(researchBrief));
