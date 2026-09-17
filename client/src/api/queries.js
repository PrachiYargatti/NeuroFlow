import { api } from './client.js';

export const queryKeys = {
  me: ['auth', 'me'],
  dashboard: ['dashboard'],
  workspaces: ['workspaces'],
  workspace: (id) => ['workspaces', id],
  documents: (workspaceId) => ['workspaces', workspaceId, 'documents'],
  runs: (workspaceId) => ['workspaces', workspaceId, 'runs'],
  run: (id) => ['runs', id],
  threads: (workspaceId) => ['workspaces', workspaceId, 'chat'],
  messages: (workspaceId, threadId) => ['workspaces', workspaceId, 'chat', threadId]
};

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function fetchDashboard() {
  const { data } = await api.get('/dashboard');
  return data;
}

export async function fetchWorkspaces() {
  const { data } = await api.get('/workspaces');
  return data.workspaces;
}

export async function fetchWorkspace(id) {
  const { data } = await api.get(`/workspaces/${id}`);
  return data.workspace;
}

export async function fetchDocuments(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/documents`);
  return data.documents;
}

export async function fetchRuns(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/runs`);
  return data.runs;
}

export async function fetchRun(id) {
  const { data } = await api.get(`/runs/${id}`);
  return data.run;
}

export async function fetchThreads(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/chat`);
  return data.threads;
}

export async function fetchMessages(workspaceId, threadId) {
  if (!threadId) return [];
  const { data } = await api.get(`/workspaces/${workspaceId}/chat/${threadId}/messages`);
  return data.messages;
}
