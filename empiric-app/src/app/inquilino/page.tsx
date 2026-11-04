import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Gift, Home, Receipt, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { date, daysUntil, money, monthYear } from "@/lib/format";
import { invoiceStatus, ticketStatus } from "@/lib/labels";

export const metadata: Metadata = { title: "Início" };

export default async function TenantHome() {
  const supabase = await createClient();
  const [{ data: property }, { data: invoices }, { data: tickets }] = await Promise.all([
    supabase.from("properties").select("id, title, street, number, complement, district, city, state, bedrooms, area_m2").limit(1).maybeSingle(),
    supabase.from("invoices").select("id, competence, due_date, amount, status").order("due_date", { ascending: false }).limit(6),
    supabase.from("tickets").select("id, number, title, status, created_at").neq("status", "done").order("created_at", { ascending: false }).limit(3),
  ]);
  const next = invoices?.filter((i) => i.status === "pending" || i.status === "overdue").sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const daysLeft = next ? daysUntil(next.due_date) : null;

  return (
    <>
      <PageHeader eyebrow="Área do inquilino" title="Tudo em dia com" accent="sua casa." />

      <section className="stagger grid gap-4 lg:grid-cols-3">
        {/* Próxima fatura */}
        <Card tone="vinho" className="relative overflow-hidden p-7 shadow-[var(--shadow-brand)] lg:col-span-2">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-white/[0.07] blur-2xl" />
          <p className="text-sm text-white/70">Próxima fatura</p>
          {next ? (
            <>
              <p className="heading mt-2 text-[44px] font-bold leading-none tracking-[-0.045em]">{money(next.amount)}</p>
              <p className="mt-3 text-white/80">
                Vence em <strong className="font-medium text-white">{date(next.due_date)}</strong>
                {daysLeft !== null && (daysLeft >= 0 ? ` · faltam ${daysLeft} dia${daysLeft === 1 ? "" : "s"}` : " · vencida")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/inquilino/faturas" className="!bg-white !text-vinho hover:!bg-rose-mist">Ver boleto <ArrowRight className="size-4" /></ButtonLink>
                <Badge tone={next.status === "overdue" ? "danger" : "brand"}>{invoiceStatus[next.status][0]} · {monthYear(next.competence)}</Badge>
              </div>
            </>
          ) : (
            <p className="mt-3 text-lg text-white/85">Nenhuma fatura em aberto. Tudo em dia! ✓</p>
          )}
        </Card>

        {/* Imóvel */}
        <Card className="p-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-stone"><Home className="size-4 text-bordo" aria-hidden /> Seu imóvel</div>
          {property ? (
            <>
              <p className="heading text-xl font-semibold">{property.title}</p>
              <p className="mt-1 text-sm text-stone">
                {[property.street, property.number, property.complement].filter(Boolean).join(", ")}<br />
                {property.district ? `${property.district} · ` : ""}{property.city}/{property.state}
              </p>
              <div className="mt-4 flex gap-2">
                {property.bedrooms != null && <Badge>{property.bedrooms} quartos</Badge>}
                {property.area_m2 != null && <Badge>{Number(property.area_m2)} m²</Badge>}
              </div>
            </>
          ) : <p className="text-sm text-stone">Seu contrato ainda não foi vinculado. Fale com a Empiric.</p>}
        </Card>
      </section>

      {/* Atalhos */}
      <nav className="stagger mt-4 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Atalhos">
        {[
          { href: "/inquilino/chamados", label: "Abrir chamado", icon: Wrench },
          { href: "/inquilino/faturas", label: "Faturas e recibos", icon: Receipt },
          { href: "/inquilino/documentos", label: "Contrato e vistoria", icon: FileText },
          { href: "/inquilino/indique", label: "Indique e Ganhe", icon: Gift },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="group flex items-center gap-3 rounded-[20px] bg-paper p-4 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-rose-mist text-bordo"><Icon className="size-[18px]" aria-hidden /></span>
            <span className="text-sm font-semibold leading-tight">{label}</span>
          </Link>
        ))}
      </nav>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Histórico de faturas" />
          {!invoices?.length ? <EmptyState icon={Receipt} title="Nenhuma fatura ainda" description="Os boletos publicados pela Empiric aparecerão aqui." /> : (
            <ul className="divide-y divide-cream px-6 pb-3">
              {invoices.map((i) => {
                const [label, tone] = invoiceStatus[i.status];
                return (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                    <span><span className="font-semibold">{monthYear(i.competence)}</span><span className="block text-xs text-stone">Venc. {date(i.due_date)}</span></span>
                    <span className="flex items-center gap-3"><span className="text-sm">{money(i.amount)}</span><Badge tone={tone}>{label}</Badge></span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Chamados em aberto" action={<Link href="/inquilino/chamados" className="inline-flex items-center text-sm font-medium text-bordo">Ver todos</Link>} />
          {!tickets?.length ? <EmptyState icon={Wrench} title="Nenhum chamado aberto" description="Algo precisa de reparo? Abra um chamado e acompanhe por aqui." /> : (
            <ul className="divide-y divide-cream px-6 pb-3">
              {tickets.map((t) => {
                const [label, tone] = ticketStatus[t.status];
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <span><span className="font-medium">#{t.number} · {t.title}</span><span className="block text-xs text-stone">Aberto em {date(t.created_at)}</span></span>
                    <Badge tone={tone}>{label}</Badge>
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
