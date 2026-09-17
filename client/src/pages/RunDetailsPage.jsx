import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { fetchRun, queryKeys } from '../api/queries.js';

export function RunDetailsPage() {
  const { runId } = useParams();
  const { data: run, isLoading } = useQuery({
    queryKey: queryKeys.run(runId),
    queryFn: () => fetchRun(runId)
  });

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading run...</p>;
  }

  return (
    <div className="space-y-4">
      <Link to={`/workspaces/${run.workspaceId}`} className="inline-flex items-center gap-2 text-sm font-medium text-accent">
        <ArrowLeft className="h-4 w-4" />
        Back to workspace
      </Link>

      <section className="rounded-lg border border-line bg-white p-5">
        <p className="text-sm text-slate-600">{run.type}</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">{run.title}</h1>
        <p className="mt-2 text-sm text-slate-600">Status: {run.status}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel title="Output">
            <pre className="max-h-[520px] overflow-auto rounded-md bg-slate-950 p-4 text-sm text-slate-100">
              {JSON.stringify(run.output, null, 2)}
            </pre>
          </Panel>

          <Panel title="Input">
            <pre className="overflow-auto rounded-md bg-slate-100 p-4 text-sm text-slate-800">
              {JSON.stringify(run.input, null, 2)}
            </pre>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Evaluation">
            <p className="text-sm text-slate-700">{run.evaluation?.note || 'No evaluation saved.'}</p>
            {run.evaluation?.confidence ? (
              <p className="mt-2 text-sm font-medium text-ink">Confidence: {run.evaluation.confidence}</p>
            ) : null}
          </Panel>

          <Panel title="Citations">
            <div className="space-y-2">
              {run.citations?.length ? (
                run.citations.map((citation, index) => (
                  <div key={`${citation.documentId}-${citation.chunkIndex}-${index}`} className="rounded-md border border-line p-3">
                    <p className="text-sm font-medium text-ink">{citation.documentName}</p>
                    <p className="mt-1 text-xs text-slate-600">{citation.snippet}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No citations saved.</p>
              )}
            </div>
          </Panel>

          <Panel title="Trace">
            <div className="space-y-2">
              {run.trace?.map((item, index) => (
                <div key={`${item.stage}-${index}`} className="flex gap-2 rounded-md border border-line p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                  <div>
                    <p className="text-sm font-medium text-ink">{item.stage}</p>
                    <p className="text-xs text-slate-600">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="mb-3 font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}
