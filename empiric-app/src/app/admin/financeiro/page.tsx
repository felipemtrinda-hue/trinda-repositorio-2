import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { date, money, monthYear } from "@/lib/format";
import { invoiceStatus } from "@/lib/labels";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export const metadata = { title: "Boletos" };
const FILTERS = [["", "Todos"], ["pending", "Em aberto"], ["overdue", "Vencidos"], ["paid", "Pagos"], ["cancelled", "Cancelados"]] as const;

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string; mes?: string }> }) {
  const { status = "", mes = "" } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("invoices")
    .select("id, competence, due_date, amount, status, published_at, paid_amount, lease:leases(property:properties(title), tenant:profiles(full_name))")
    .order("due_date", { ascending: false }).limit(300);
  if (status) q = q.eq("status", status);
  if (/^\d{4}-\d{2}$/.test(mes)) q = q.eq("competence", `${mes}-01`);
  const { data: rows } = await q;
  const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
  const sum = (st: string) => (rows ?? []).filter((r) => r.status === st).reduce((s, r) => s + Number(st === "paid" ? r.paid_amount ?? r.amount : r.amount), 0);

  return (
    <>
      <PageHeader eyebrow="Financeiro" title="Boletos" accent="e pagamentos"
        actions={<ButtonLink href="/admin/financeiro/novo"><Plus className="size-4" /> Lançar boleto</ButtonLink>} />
      <section className="stagger mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Clock} label="Em aberto" value={money(sum("pending"))} hint="Na seleção atual" />
        <StatCard tone="accent" icon={AlertTriangle} label="Vencidos" value={money(sum("overdue"))} hint="Na seleção atual" />
        <StatCard tone="vinho" icon={CheckCircle2} label="Recebido" value={money(sum("paid"))} hint="Na seleção atual" />
      </section>
      <form className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(([v, label]) => (
          <button key={v} name="status" value={v} className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium ${status === v ? "bg-vinho text-white" : "bg-mist text-graphite hover:bg-[#ebebef]"}`}>{label}</button>
        ))}
        <input type="month" name="mes" defaultValue={mes} aria-label="Competência" className="h-9 rounded-full bg-mist px-4 text-sm" />
      </form>
      <Card className="overflow-hidden">
        {!rows?.length ? (
          <EmptyState icon={Wallet} title="Nenhum boleto" description="Lance o primeiro boleto de um contrato ativo."
            action={<ButtonLink href="/admin/financeiro/novo"><Plus className="size-4" /> Lançar boleto</ButtonLink>} />
        ) : (
          <ul className="divide-y divide-cream">
            {rows.map((r) => {
              const lease = one(r.lease) as { property: { title: string } | { title: string }[]; tenant: { full_name: string } | { full_name: string }[] } | null;
              const [label, tone] = invoiceStatus[r.status];
              return (
                <li key={r.id}>
                  <Link href={`/admin/financeiro/${r.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-mist md:px-6">
                    <span className="w-20 shrink-0 font-semibold">{monthYear(r.competence)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{(one(lease?.property ?? []) as { title: string } | undefined)?.title}</span>
                      <span className="block truncate text-sm text-stone">{(one(lease?.tenant ?? []) as { full_name: string } | undefined)?.full_name} · venc. {date(r.due_date)}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{money(r.amount)}</span>
                    {!r.published_at && <Badge tone="warning">Rascunho</Badge>}
                    <Badge tone={tone}>{label}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
