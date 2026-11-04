import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { date, daysUntil, money } from "@/lib/format";
import { leaseStatus } from "@/lib/labels";

export const metadata = { title: "Contratos" };
const FILTERS = [["", "Todos"], ["active", "Ativos"], ["awaiting_signature", "Aguardando assinatura"], ["draft", "Rascunhos"], ["ended", "Encerrados"]] as const;

export default async function LeasesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("leases").select("id, status, start_date, end_date, rent_amount, renewal_alert_days, property:properties(title), tenant:profiles(full_name)")
    .order("end_date").limit(200);
  if (status) q = q.eq("status", status);
  const { data: rows } = await q;
  const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);

  return (
    <>
      <PageHeader eyebrow="Locação" title="Contratos" accent="de locação"
        actions={<ButtonLink href="/admin/contratos/novo"><Plus className="size-4" /> Novo contrato</ButtonLink>} />
      <form className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([v, label]) => (
          <button key={v} name="status" value={v} className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium ${status === v ? "bg-vinho text-white" : "bg-mist text-graphite hover:bg-[#ebebef]"}`}>{label}</button>
        ))}
      </form>
      <Card className="overflow-hidden">
        {!rows?.length ? (
          <EmptyState icon={FileText} title="Nenhum contrato" description="Cadastre um contrato ligando imóvel e inquilino."
            action={<ButtonLink href="/admin/contratos/novo"><Plus className="size-4" /> Novo contrato</ButtonLink>} />
        ) : (
          <ul className="divide-y divide-cream">
            {rows.map((l) => {
              const [label, tone] = leaseStatus[l.status];
              const left = daysUntil(l.end_date);
              const expiring = l.status === "active" && left <= l.renewal_alert_days;
              return (
                <li key={l.id}>
                  <Link href={`/admin/contratos/${l.id}`} className="flex flex-col gap-2 px-5 py-4 transition hover:bg-mist sm:flex-row sm:items-center md:px-6">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{(one(l.property) as { title: string })?.title}</span>
                      <span className="block truncate text-sm text-stone">{(one(l.tenant) as { full_name: string })?.full_name} · {money(l.rent_amount)}</span>
                    </span>
                    <span className="text-sm text-stone">{date(l.start_date)} – {date(l.end_date)}</span>
                    <span className="flex gap-2">
                      {expiring && <Badge tone="warning">{left >= 0 ? `Vence em ${left}d` : "Vencido"}</Badge>}
                      <Badge tone={tone}>{label}</Badge>
                    </span>
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
