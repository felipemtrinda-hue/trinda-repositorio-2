import { notFound } from "next/navigation";
import { CheckCircle2, Hammer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import type { Planned } from "./planned";

export function PlannedPage({ map, slug, eyebrow }: { map: Record<string, Planned>; slug: string; eyebrow: string }) {
  const m = map[slug];
  if (!m) notFound();
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={m.title} accent={m.accent} />
      <Card className="max-w-3xl p-8 animate-[var(--animate-rise)]">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-rose-mist text-vinho"><Hammer className="size-5" aria-hidden /></span>
          <div>
            <p className="heading font-medium">Tela em construção</p>
            <p className="text-sm text-stone">Banco de dados e permissões prontos — interface prevista para a próxima etapa.</p>
          </div>
          <Badge tone="brand">{m.stage}</Badge>
        </div>
        <ul className="space-y-3">
          {m.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-[15px]">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-bordo" aria-hidden /> {f}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
