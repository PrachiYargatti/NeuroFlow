import { BrainCircuit } from 'lucide-react';

export function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-2 font-semibold text-ink">
            <BrainCircuit className="h-6 w-6 text-accent" />
            <span>NeuroFlow AI</span>
          </div>
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
