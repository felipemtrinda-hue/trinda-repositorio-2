import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

export function StatCard({ label, value, hint, icon: Icon, tone = "paper" }: {
  label: string; value: string | number; hint?: string; icon: LucideIcon; tone?: "paper" | "vinho" | "accent";
}) {
  const dark = tone === "vinho";
  return (
    <Card tone={tone} className="p-6">
      <div className="flex items-start justify-between">
        <p className={`text-sm font-medium ${dark ? "text-white/75" : "text-stone"}`}>{label}</p>
        <span className={`grid size-10 place-items-center rounded-2xl ${dark ? "bg-white/15 text-white" : "bg-rose-mist text-bordo"}`}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className={`heading mt-4 whitespace-nowrap text-[30px] font-bold leading-none tracking-[-0.04em] ${dark ? "text-white" : "text-charcoal"}`}>
        {value}
      </p>
      {hint && <p className={`mt-2 text-sm ${dark ? "text-white/70" : "text-stone"}`}>{hint}</p>}
    </Card>
  );
}
