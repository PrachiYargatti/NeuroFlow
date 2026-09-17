export function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}
