import type { ReactNode } from "react";

/** Título editorial: passe a palavra de destaque em `accent` (fica em itálico). */
export function PageHeader({
  eyebrow, title, accent, description, actions,
}: { eyebrow?: string; title: string; accent?: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-[var(--animate-rise)]">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="display text-[40px] md:text-[52px] text-charcoal">
          {title} {accent && <em>{accent}</em>}
        </h1>
        {description && <p className="mt-3 text-stone">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
