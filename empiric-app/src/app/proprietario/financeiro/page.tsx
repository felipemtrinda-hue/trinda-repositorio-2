import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DocList, type DocRow } from "@/components/documents/doc-list";
import { date, money, monthYear } from "@/lib/format";
import { invoiceStatus } from "@/lib/labels";

export const metadata = { title: "Recibos" };

export default async function OwnerFinance() {
  const supabase = await createClient();
  const [{ data: docs }, { data: invoices }] = await Promise.all([
    supabase.from("documents").select("id, title, kind, mime_type, size_bytes, published_at, base_year, competence")
      .in("kind", ["receipt", "statement"]).order("competence", { ascending: false, nullsFirst: false }),
    supabase.from("invoices").select("id, competence, due_date, amount, status, paid_at, lease:leases(property:properties(title))")
      .neq("status", "cancelled").order("competence", { ascending: false }).limit(36),
  ]);
  const byYear = new Map<string, DocRow[]>();
  ((docs ?? []) as DocRow[]).forEach((d) => {
    const y = (d.competence ?? d.published_at ?? "").slice(0, 4) || "Sem data";
    byYear.set(y, [...(byYear.get(y) ?? []), d]);
  });
  const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);

  return (
    <>
      <PageHeader eyebrow="Financeiro" title="Recibos" accent="e repasses" description="Recibos e demonstrativos mensais publicados pela Empiric." />
      <div className="space-y-6">
        {byYear.size === 0 ? (
          <Card><EmptyState icon={Receipt} title="Nenhum recibo publicado" description="Os recibos mensais dos seus imóveis aparecerão aqui, organizados por competência." /></Card>
        ) : [...byYear.entries()].map(([year, list]) => (
          <section key={year}>
            <h2 className="heading mb-3 text-lg font-bold tabular-nums">{year}</h2>
            <Card className="overflow-hidden"><DocList docs={list} /></Card>
          </section>
        ))}
        {(invoices?.length ?? 0) > 0 && (
          <section>
            <h2 className="heading mb-3 text-lg font-bold">Situação dos aluguéis</h2>
            <Card className="divide-y divide-cream overflow-hidden">
              {invoices!.map((i) => {
                const [label, tone] = invoiceStatus[i.status];
                const title = (one((one(i.lease) as { property: { title: string } | { title: string }[] } | null)?.property ?? []) as { title: string } | undefined)?.title;
                return (
                  <div key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 md:px-6">
                    <span className="w-20 shrink-0 font-semibold">{monthYear(i.competence)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-stone">{title} · {i.status === "paid" ? `pago em ${date(i.paid_at)}` : `vence ${date(i.due_date)}`}</span>
                    <span className="text-sm tabular-nums">{money(i.amount)}</span>
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                );
              })}
            </Card>
          </section>
        )}
      </div>
    </>
  );
}
