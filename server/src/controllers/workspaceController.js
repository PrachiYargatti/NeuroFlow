import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspace
} from '../services/workspaceService.js';

export async function index(req, res) {
  res.json({ workspaces: await listWorkspaces(req.user.id) });
}

export async function create(req, res) {
  res.status(201).json({ workspace: await createWorkspace(req.user.id, req.body) });
}

export async function show(req, res) {
  res.json({ workspace: await getWorkspace(req.user.id, req.params.id) });
}

export async function update(req, res) {
  res.json({ workspace: await updateWorkspace(req.user.id, req.params.id, req.body) });
}

export async function destroy(req, res) {
  await deleteWorkspace(req.user.id, req.params.id);
  res.status(204).end();
}
