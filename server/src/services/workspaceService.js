import { getRepository } from '../data/repository.js';
import { httpError } from '../utils/httpError.js';

export async function listWorkspaces(userId) {
  return getRepository().getAll('workspaces', { userId }, { updatedAt: -1 });
}

export async function createWorkspace(userId, data) {
  if (!data.name?.trim()) {
    throw httpError(400, 'Workspace name is required');
  }

  return getRepository().create('workspaces', {
    userId,
    name: data.name.trim(),
    description: data.description || '',
    color: data.color || '#2563eb'
  });
}

export async function getWorkspace(userId, id) {
  const workspace = await getRepository().getOne('workspaces', { id, userId });
  if (!workspace) {
    throw httpError(404, 'Workspace not found');
  }
  return workspace;
}

export async function updateWorkspace(userId, id, data) {
  await getWorkspace(userId, id);
  return getRepository().updateById('workspaces', id, {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.color !== undefined ? { color: data.color } : {})
  });
}

export async function deleteWorkspace(userId, id) {
  await getWorkspace(userId, id);
  const repository = getRepository();
  await repository.deleteWhere('documents', { userId, workspaceId: id });
  await repository.deleteWhere('document_chunks', { userId, workspaceId: id });
  await repository.deleteWhere('chat_threads', { userId, workspaceId: id });
  await repository.deleteWhere('chat_messages', { userId, workspaceId: id });
  await repository.deleteWhere('workflow_runs', { userId, workspaceId: id });
  await repository.deleteById('workspaces', id);
}
