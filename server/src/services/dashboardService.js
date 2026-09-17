import { getRepository } from '../data/repository.js';

export async function getDashboard(userId) {
  const repository = getRepository();
  const [workspaces, documents, runs] = await Promise.all([
    repository.getAll('workspaces', { userId }, { updatedAt: -1 }),
    repository.getAll('documents', { userId }, { updatedAt: -1 }),
    repository.getAll('workflow_runs', { userId }, { updatedAt: -1 })
  ]);

  return {
    counts: {
      workspaces: workspaces.length,
      documents: documents.length,
      runs: runs.length
    },
    recentWorkspaces: workspaces.slice(0, 5),
    recentRuns: runs.slice(0, 5)
  };
}
