import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../api/client.js';
import { fetchWorkspaces, queryKeys } from '../api/queries.js';

export function WorkspacesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: fetchWorkspaces
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/workspaces', { name });
      return data.workspace;
    },
    onSuccess: () => {
      setName('');
      setError('');
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (err) => setError(apiMessage(err))
  });

  function submit(event) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Workspaces</h1>
        <p className="mt-1 text-sm text-slate-600">Create a bounded document intelligence space.</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Workspace name"
          className="focus-ring min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </form>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-2">
        {isLoading ? <p className="text-sm text-slate-600">Loading workspaces...</p> : null}
        {workspaces.map((workspace) => (
          <Link
            key={workspace.id}
            to={`/workspaces/${workspace.id}`}
            className="rounded-lg border border-line bg-white p-4 hover:border-accent"
          >
            <div className="mb-3 h-2 w-16 rounded-full" style={{ background: workspace.color }} />
            <h2 className="font-semibold text-ink">{workspace.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{workspace.description || 'Ready for documents.'}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
