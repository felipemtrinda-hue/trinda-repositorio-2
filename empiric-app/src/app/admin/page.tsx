import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowUpRight, Building2, CalendarDays, FileText, Wallet, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { RevenueBars, Segments } from "@/components/charts/bars";
import { date, money, relative } from "@/lib/format";
import { actionLabel, entityLabel } from "@/lib/labels";

export const metadata: Metadata = { title: "Visão geral" };

type Summary = {
  properties: Record<"total" | "rented" | "available" | "reserved" | "maintenance", number>;
  leases: Record<"active" | "expiring" | "ended" | "awaiting_signature", number>;
  invoices: Record<"issued" | "paid" | "pending" | "overdue" | "received" | "receivable", number>;
  tickets: Record<"new" | "analysis" | "waiting_third_party" | "in_progress" | "done", number>;
  monthly: { month: string; received: number; open: number }[];
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 864e5);

  const [{ data: summary, error }, { data: logs }, { data: events }] = await Promise.all([
    supabase.rpc("admin_dashboard_summary"),
    supabase.from("activity_logs").select("id, action, entity, created_at, actor:profiles(full_name)")
      .order("created_at", { ascending: false }).limit(8),
    supabase.from("calendar_events").select("id, title, kind, starts_at")
      .gte("starts_at", now.toISOString()).lte("starts_at", in30.toISOString())
      .order("starts_at").limit(6),
  ]);

  if (error || !summary) {
    return (
      <Card className="p-8">
        <p className="font-medium text-danger">Não foi possível carregar o painel.</p>
        <p className="text-sm text-stone">Verifique se as migrações do banco foram aplicadas (README → Banco de dados).</p>
      </Card>
    );
  }
  const s = summary as Summary;
  const openTickets = s.tickets.new + s.tickets.analysis + s.tickets.waiting_third_party + s.tickets.in_progress;

  return (
    <>
      <PageHeader eyebrow="Painel administrativo" title="Tudo o que acontece," accent="em um só lugar." />

      <section className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
        <StatCard tone="vinho" icon={Building2} label="Imóveis na carteira" value={s.properties.total}
          hint={`${s.properties.rented} alugados · ${s.properties.available} disponíveis`} />
        <StatCard icon={FileText} label="Contratos ativos" value={s.leases.active}
          hint={s.leases.expiring ? `${s.leases.expiring} perto do vencimento` : "Nenhum vencendo em breve"} />
        <StatCard icon={Wallet} label="A receber" value={money(s.invoices.receivable)}
          hint={`${s.invoices.overdue} vencidos · ${s.invoices.pending} em aberto`} />
        <StatCard tone="accent" icon={Wrench} label="Chamados abertos" value={openTickets}
          hint={`${s.tickets.new} novos aguardando triagem`} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-[var(--animate-rise)]">
          <CardHeader title="Recebimentos" action={<span className="text-sm text-stone">Últimos 6 meses</span>} />
          <div className="px-6 pb-6">
            <p className="heading mb-6 text-3xl font-medium tracking-[-0.04em]">{money(s.invoices.received)}
              <span className="ml-2 text-sm font-normal tracking-normal text-stone">recebidos em 12 meses</span></p>
            <RevenueBars data={s.monthly} />
          </div>
        </Card>
        <Card className="animate-[var(--animate-rise)]">
          <CardHeader title="Situação dos imóveis" />
          <div className="px-6 pb-6">
            <Segments items={[
              { label: "Alugados", value: s.properties.rented, color: "var(--color-vinho)" },
              { label: "Disponíveis", value: s.properties.available, color: "var(--color-success)" },
              { label: "Reservados", value: s.properties.reserved, color: "var(--color-info)" },
              { label: "Manutenção", value: s.properties.maintenance, color: "var(--color-warning)" },
            ]} />
            <div className="my-6 h-px bg-cream" />
            <p className="mb-3 text-sm font-medium">Chamados por etapa</p>
            <Segments items={[
              { label: "Novos", value: s.tickets.new, color: "var(--color-bordo)" },
              { label: "Em análise", value: s.tickets.analysis, color: "var(--color-info)" },
              { label: "Terceiro", value: s.tickets.waiting_third_party, color: "var(--color-warning)" },
              { label: "Andamento", value: s.tickets.in_progress, color: "#5b6b8c" },
            ]} />
          </div>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Próximos 30 dias" icon={<CalendarDays className="size-4 text-bordo" />}
            action={<Link href="/admin/agenda" className="inline-flex items-center gap-1 text-sm font-medium text-bordo">Agenda <ArrowUpRight className="size-3.5" /></Link>} />
          {!events?.length ? (
            <EmptyState icon={CalendarDays} title="Agenda livre" description="Vencimentos, vistorias e fim de contratos aparecerão aqui." />
          ) : (
            <ul className="divide-y divide-cream px-6 pb-3">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="truncate">{e.title}</span>
                  <time className="shrink-0 text-sm text-stone">{date(e.starts_at)}</time>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Atividades recentes" icon={<Activity className="size-4 text-bordo" />} />
          {!logs?.length ? (
            <EmptyState icon={Activity} title="Sem atividades ainda" description="Cadastros, uploads, pagamentos e logins ficam registrados aqui." />
          ) : (
            <ul className="divide-y divide-cream px-6 pb-3">
              {logs.map((l) => {
                const actor = (Array.isArray(l.actor) ? l.actor[0] : l.actor) as { full_name: string } | null;
                return (
                  <li key={l.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="truncate">
                      <span className="font-medium">{actor?.full_name ?? "Sistema"}</span>{" "}
                      {actionLabel[l.action] ?? l.action} {entityLabel[l.entity] ?? l.entity}
                    </span>
                    <time className="shrink-0 text-xs text-stone">{relative(l.created_at)}</time>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </>
  );
}
