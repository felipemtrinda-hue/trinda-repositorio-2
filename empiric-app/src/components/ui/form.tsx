import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-[16px] border border-transparent bg-mist px-4 text-[15px] text-charcoal transition-[border,box-shadow,background] placeholder:text-stone/70 focus:border-bordo/60 focus:bg-paper focus:shadow-[0_0_0_4px_var(--color-rose-mist)] focus:outline-none disabled:opacity-60";

function Label({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-graphite">
      {label}{required && <span className="text-bordo" aria-hidden> *</span>}
    </label>
  );
}

export function Input({ label, id, hint, className = "", ...props }: ComponentProps<"input"> & { label: string; id: string; hint?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label id={id} label={label} required={props.required} />
      <input id={id} name={props.name ?? id} className={`${control} h-[52px]`} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      {hint && <p id={`${id}-hint`} className="text-xs text-stone">{hint}</p>}
    </div>
  );
}

export function Select({ label, id, options, placeholder, className = "", ...props }: ComponentProps<"select"> & {
  label: string; id: string; options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label id={id} label={label} required={props.required} />
      <select id={id} name={props.name ?? id} className={`${control} h-[52px] appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20fill='none'%20stroke='%236e6e73'%20stroke-width='2'%3E%3Cpath%20d='m4%206%204%204%204-4'/%3E%3C/svg%3E")] bg-[right_1rem_center] bg-no-repeat pr-10`} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Textarea({ label, id, className = "", ...props }: ComponentProps<"textarea"> & { label: string; id: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label id={id} label={label} required={props.required} />
      <textarea id={id} name={props.name ?? id} rows={4} className={`${control} py-3`} {...props} />
    </div>
  );
}

export function FormSection({ title, description, children, aside }: { title: string; description?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-[24px] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="heading text-lg font-bold">{title}</h2>
          {description && <p className="mt-1 text-sm text-stone">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const c = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[cols];
  return <div className={`grid gap-4 ${c}`}>{children}</div>;
}
