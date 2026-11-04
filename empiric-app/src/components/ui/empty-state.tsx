import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-[20px] bg-rose-mist text-bordo">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="heading font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-stone">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
