import type { ComponentProps } from "react";

export function Field({ label, id, hint, ...props }: ComponentProps<"input"> & { label: string; id: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-graphite">{label}</label>
      <input
        id={id}
        name={id}
        className="h-[52px] w-full rounded-[16px] border border-transparent bg-mist px-4 text-[15px] text-charcoal transition-[border,box-shadow,background] placeholder:text-stone/70 focus:border-bordo/60 focus:bg-paper focus:shadow-[0_0_0_4px_var(--color-rose-mist)] focus:outline-none"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && <p id={`${id}-hint`} className="text-xs text-stone">{hint}</p>}
    </div>
  );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <p role={error ? "alert" : "status"}
      className={`rounded-2xl px-4 py-3 text-sm animate-[var(--animate-fade)] ${error ? "bg-danger-bg text-danger" : "bg-success-bg text-success"}`}>
      {error ?? success}
    </p>
  );
}
