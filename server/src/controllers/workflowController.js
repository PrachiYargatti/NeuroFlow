import { askWorkspace, getRun, listMessages, listRuns, listThreads, runWorkflow } from '../services/workflowService.js';

export async function listWorkspaceRuns(req, res) {
  res.json({ runs: await listRuns(req.user.id, req.params.workspaceId) });
}

export async function showRun(req, res) {
  res.json({ run: await getRun(req.user.id, req.params.id) });
}

export async function summarize(req, res) {
  res.status(201).json({ run: await runWorkflow(req.user.id, req.params.workspaceId, 'summarize', req.body) });
}

export async function compare(req, res) {
  res.status(201).json({ run: await runWorkflow(req.user.id, req.params.workspaceId, 'compare', req.body) });
}

export async function actionItems(req, res) {
  res.status(201).json({ run: await runWorkflow(req.user.id, req.params.workspaceId, 'meeting_action_items', req.body) });
}

export async function researchBrief(req, res) {
  res.status(201).json({ run: await runWorkflow(req.user.id, req.params.workspaceId, 'research_brief', req.body) });
}

export async function ask(req, res) {
  res.status(201).json(await askWorkspace(req.user.id, req.params.workspaceId, req.body));
}

export async function threads(req, res) {
  res.json({ threads: await listThreads(req.user.id, req.params.workspaceId) });
}

export async function messages(req, res) {
  res.json({ messages: await listMessages(req.user.id, req.params.workspaceId, req.params.threadId) });
}
