import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  FileText,
  MessageSquareText,
  RefreshCw,
  Send,
  Trash2,
  Upload,
  Workflow
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage } from '../api/client.js';
import {
  fetchDocuments,
  fetchMessages,
  fetchRuns,
  fetchThreads,
  fetchWorkspace,
  queryKeys
} from '../api/queries.js';

const stages = ['Planner', 'Retriever', 'Task', 'Writer', 'Evaluator'];

export function WorkspaceDetailsPage() {
  const { workspaceId } = useParams();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [error, setError] = useState('');

  const { data: workspace, isLoading } = useQuery({
    queryKey: queryKeys.workspace(workspaceId),
    queryFn: () => fetchWorkspace(workspaceId)
  });
  const { data: documents = [] } = useQuery({
    queryKey: queryKeys.documents(workspaceId),
    queryFn: () => fetchDocuments(workspaceId)
  });
  const { data: runs = [] } = useQuery({
    queryKey: queryKeys.runs(workspaceId),
    queryFn: () => fetchRuns(workspaceId)
  });
  const { data: threads = [] } = useQuery({
    queryKey: queryKeys.threads(workspaceId),
    queryFn: () => fetchThreads(workspaceId)
  });

  const activeThreadId = threads[0]?.id;
  const { data: messages = [] } = useQuery({
    queryKey: queryKeys.messages(workspaceId, activeThreadId),
    queryFn: () => fetchMessages(workspaceId, activeThreadId)
  });

  const readyDocuments = documents.filter((document) => document.status === 'ready');
  const completedRuns = runs.filter((run) => run.status === 'completed');
  const graphActive = useMemo(
    () => ({
      Planner: Boolean(workspace),
      Retriever: readyDocuments.length > 0,
      Task: runs.length > 0,
      Writer: completedRuns.some((run) => Object.keys(run.output || {}).length),
      Evaluator: completedRuns.some((run) => Object.keys(run.evaluation || {}).length)
    }),
    [workspace, readyDocuments.length, runs, completedRuns]
  );

  function refreshWorkspaceData() {
    queryClient.invalidateQueries({ queryKey: queryKeys.documents(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.runs(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.threads(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.messages(workspaceId, activeThreadId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  }

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post(`/workspaces/${workspaceId}/documents/upload`, form);
      return data.document;
    },
    onSuccess: () => {
      setFile(null);
      setError('');
      refreshWorkspaceData();
    },
    onError: (err) => setError(apiMessage(err))
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/documents/${id}`),
    onSuccess: refreshWorkspaceData,
    onError: (err) => setError(apiMessage(err))
  });

  const reprocessMutation = useMutation({
    mutationFn: (id) => api.post(`/documents/${id}/reprocess`),
    onSuccess: refreshWorkspaceData,
    onError: (err) => setError(apiMessage(err))
  });

  const workflowMutation = useMutation({
    mutationFn: async ({ endpoint, body }) => {
      const { data } = await api.post(`/workspaces/${workspaceId}/${endpoint}`, body);
      return data;
    },
    onSuccess: () => {
      setPrompt('');
      setQuestion('');
      setError('');
      refreshWorkspaceData();
    },
    onError: (err) => setError(apiMessage(err))
  });

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading workspace...</p>;
  }

  function handleUpload(event) {
    event.preventDefault();
    if (!file) {
      setError('Choose a file to upload');
      return;
    }
    uploadMutation.mutate();
  }

  function toggleDoc(id) {
    setSelectedDocs((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function runWorkflow(endpoint, body = {}) {
    workflowMutation.mutate({ endpoint, body });
  }

  function askQuestion(event) {
    event.preventDefault();
    if (!question.trim()) return;
    runWorkflow('chat', { question });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 h-2 w-20 rounded-full" style={{ background: workspace.color }} />
            <h1 className="text-2xl font-semibold text-ink">{workspace.name}</h1>
            <p className="mt-1 text-sm text-slate-600">{workspace.description || 'No description yet.'}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Docs" value={documents.length} />
            <MiniStat label="Runs" value={runs.length} />
            <MiniStat label="Ready" value={readyDocuments.length} />
          </div>
        </div>
      </section>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel icon={Upload} title="Upload documents">
            <form onSubmit={handleUpload} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="focus-ring min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={uploadMutation.isPending}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            </form>
          </Panel>

          <Panel icon={FileText} title="Documents">
            <div className="space-y-2">
              {documents.length ? (
                documents.map((document) => (
                  <div key={document.id} className="rounded-md border border-line p-3">
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex min-w-0 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDocs.includes(document.id)}
                          onChange={() => toggleDoc(document.id)}
                          className="mt-1"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-ink">{document.originalName}</span>
                          <span className="text-xs text-slate-600">
                            {document.fileType} - {document.status}
                          </span>
                        </span>
                      </label>
                      <div className="flex shrink-0 gap-1">
                        <IconButton title="Reprocess" onClick={() => reprocessMutation.mutate(document.id)}>
                          <RefreshCw className="h-4 w-4" />
                        </IconButton>
                        <IconButton title="Delete" danger onClick={() => deleteMutation.mutate(document.id)}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                    {document.summary ? <p className="mt-2 text-sm text-slate-600">{document.summary}</p> : null}
                    {document.processingError ? (
                      <p className="mt-2 text-sm text-red-600">{document.processingError}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No documents have been uploaded yet.</p>
              )}
            </div>
          </Panel>

          <Panel icon={Workflow} title="Workflow actions">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Optional prompt or topic"
              className="focus-ring mb-3 min-h-20 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <WorkflowButton
                label="Summarize"
                disabled={!readyDocuments.length || workflowMutation.isPending}
                onClick={() => runWorkflow('runs/summarize', { prompt })}
              />
              <WorkflowButton
                label="Compare documents"
                disabled={selectedDocs.length < 2 || workflowMutation.isPending}
                onClick={() => runWorkflow('runs/compare', { prompt, documentIds: selectedDocs })}
              />
              <WorkflowButton
                label="Action items"
                disabled={!readyDocuments.length || workflowMutation.isPending}
                onClick={() => runWorkflow('runs/meeting-action-items', { prompt, documentIds: selectedDocs })}
              />
              <WorkflowButton
                label="Research brief"
                disabled={!readyDocuments.length || workflowMutation.isPending}
                onClick={() => runWorkflow('runs/research-brief', { prompt, topic: prompt })}
              />
            </div>
          </Panel>

          <Panel icon={Workflow} title="Recent runs">
            <div className="space-y-2">
              {runs.length ? (
                runs.slice(0, 6).map((run) => (
                  <Link
                    key={run.id}
                    to={`/runs/${run.id}`}
                    className="block rounded-md border border-line px-3 py-2 hover:border-accent"
                  >
                    <span className="block text-sm font-medium text-ink">{run.title}</span>
                    <span className="text-xs text-slate-600">{run.status}</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-600">No workflow runs yet.</p>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel icon={MessageSquareText} title="Chat">
            <div className="mb-3 max-h-80 space-y-3 overflow-y-auto rounded-md border border-line bg-slate-50 p-3">
              {messages.length ? (
                messages.map((message) => (
                  <div key={message.id} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                    <p
                      className={`inline-block max-w-full rounded-md px-3 py-2 text-sm ${
                        message.role === 'user' ? 'bg-accent text-white' : 'border border-line bg-white text-ink'
                      }`}
                    >
                      {message.content}
                    </p>
                    {message.citations?.length ? (
                      <p className="mt-1 text-xs text-slate-500">{message.citations.length} citations</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">Ask a question after at least one document is ready.</p>
              )}
            </div>
            <form onSubmit={askQuestion} className="flex gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask over this workspace"
                className="focus-ring min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={!readyDocuments.length || workflowMutation.isPending}
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-white disabled:opacity-60"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </Panel>

          <section className="rounded-lg border border-line bg-white p-4">
            <h2 className="font-semibold text-ink">Agent graph</h2>
            <div className="mt-4 space-y-2">
              {stages.map((stage, index) => (
                <div key={stage} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                      graphActive[stage] ? 'border-mint bg-mint text-white' : 'border-line text-slate-600'
                    }`}
                  >
                    {graphActive[stage] ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={graphActive[stage] ? 'text-sm font-medium text-ink' : 'text-sm text-slate-500'}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function WorkflowButton({ label, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="focus-ring rounded-md border border-line px-3 py-2 text-left text-sm font-medium text-ink hover:border-accent disabled:text-slate-400 disabled:hover:border-line"
    >
      {label}
    </button>
  );
}

function IconButton({ title, danger = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md border border-line ${
        danger ? 'text-red-600' : 'text-slate-700'
      }`}
      title={title}
    >
      {children}
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-md border border-line px-3 py-2">
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="text-xs text-slate-600">{label}</p>
    </div>
  );
}

function Panel({ icon: Icon, title, children }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-ink">
        <Icon className="h-4 w-4 text-accent" />
        {title}
      </h2>
      {children}
    </section>
  );
}
