import { forwardRef } from 'react';

export const Field = forwardRef(function Field({ label, error, ...props }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        ref={ref}
        className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
      />
      {error ? <span className="mt-1 block text-sm text-red-600">{error.message}</span> : null}
    </label>
  );
});
