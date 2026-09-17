import { Router } from 'express';
import { getRepository } from '../data/repository.js';
import { authRoutes } from './authRoutes.js';
import { dashboardRoutes } from './dashboardRoutes.js';
import { documentRoutes } from './documentRoutes.js';
import { workflowRoutes } from './workflowRoutes.js';
import { workspaceRoutes } from './workspaceRoutes.js';

export const apiRoutes = Router();

apiRoutes.get('/health', (_req, res) => {
  res.json({
    ok: true,
    repository: getRepository().mode,
    service: 'neuroflow-ai'
  });
});

apiRoutes.use('/auth', authRoutes);
apiRoutes.use(documentRoutes);
apiRoutes.use(workflowRoutes);
apiRoutes.use('/workspaces', workspaceRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);
