import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchDashboard, queryKeys } from '../api/queries.js';
import { StatCard } from '../components/StatCard.jsx';

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.dashboard, queryFn: fetchDashboard });

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Workspace activity and workflow history.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Workspaces" value={data?.counts.workspaces || 0} />
        <StatCard label="Documents" value={data?.counts.documents || 0} />
        <StatCard label="Workflow runs" value={data?.counts.runs || 0} />
      </section>

      <section className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-semibold text-ink">Recent workspaces</h2>
        </div>
        <div className="divide-y divide-line">
          {data?.recentWorkspaces?.length ? (
            data.recentWorkspaces.map((workspace) => (
              <Link
                key={workspace.id}
                to={`/workspaces/${workspace.id}`}
                className="block px-4 py-3 hover:bg-slate-50"
              >
                <p className="font-medium text-ink">{workspace.name}</p>
                <p className="text-sm text-slate-600">{workspace.description || 'No description'}</p>
              </Link>
            ))
          ) : (
            <p className="px-4 py-6 text-sm text-slate-600">No workspace activity yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
