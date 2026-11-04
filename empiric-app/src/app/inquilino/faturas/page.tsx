import { ChevronDown, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CopyField } from "@/components/ui/copy-field";
import { DocActions } from "@/components/documents/doc-actions";
import { date, daysUntil, money, monthYear } from "@/lib/format";
import { invoiceStatus } from "@/lib/labels";

export const metadata = { title: "Faturas" };

type Inv = {
  id: string; competence: string; due_date: string; amount: number; status: string; barcode: string | null; pix_code: string | null;
  document_id: string | null; paid_at: string | null; paid_amount: number | null; items: { id: string; label: string; amount: number; position: number }[];
};

export default async function TenantInvoices() {
  const supabase = await createClient();
  const { data } = await supabase.from("invoices")
    .select("id, competence, due_date, amount, status, barcode, pix_code, document_id, paid_at, paid_amount, items:invoice_items(id, label, amount, position)")
    .neq("status", "cancelled").order("competence", { ascending: false }).limit(60);
  const invoices = (data ?? []) as Inv[];
  const open = invoices.filter((i) => i.status === "pending" || i.status === "overdue").sort((a, b) => a.due_date.localeCompare(b.due_date));
  const history = invoices.filter((i) => i.status === "paid");

  const Detail = ({ i, expanded }: { i: Inv; expanded?: boolean }) => {
    const [label, tone] = invoiceStatus[i.status];
    const left = daysUntil(i.due_date);
    return (
      <details open={expanded} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 md:px-6 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{monthYear(i.competence)}</span>
            <span className="block text-sm text-stone">
              {i.status === "paid" ? `Pago em ${date(i.paid_at)}` : `Vence ${date(i.due_date)}${left >= 0 ? ` · em ${left} dia${left === 1 ? "" : "s"}` : ` · há ${-left} dia${left === -1 ? "" : "s"}`}`}
            </span>
          </span>
          <span className="font-bold tabular-nums">{money(i.status === "paid" ? i.paid_amount ?? i.amount : i.amount)}</span>
          <Badge tone={tone}>{label}</Badge>
          <ChevronDown className="size-4 text-stone transition group-open:rotate-180" aria-hidden />
        </summary>
        <div className="space-y-3 px-5 pb-5 md:px-6">
          {i.items?.length > 0 && (
            <ul className="rounded-[16px] bg-mist px-4 py-2 text-sm">
              {[...i.items].sort((a, b) => a.position - b.position).map((it) => (
                <li key={it.id} className="flex justify-between gap-3 py-1.5"><span className="text-graphite">{it.label}</span><span className="tabular-nums">{money(it.amount)}</span></li>
              ))}
            </ul>
          )}
          {i.status !== "paid" && i.pix_code && <CopyField label="Pix copia e cola" value={i.pix_code} />}
          {i.status !== "paid" && i.barcode && <CopyField label="Linha digitável do boleto" value={i.barcode} />}
          {i.document_id && <div className="flex items-center justify-between gap-3 rounded-[16px] bg-mist px-4 py-3 text-sm"><span className="font-semibold">Boleto em PDF</span><DocActions id={i.document_id} /></div>}
        </div>
      </details>
    );
  };

  return (
    <>
      <PageHeader eyebrow="Financeiro" title="Suas" accent="faturas" description="Você recebe um aviso 10 dias antes de cada vencimento." />
      {!invoices.length ? (
        <Card><EmptyState icon={Receipt} title="Nenhuma fatura ainda" description="Quando a Empiric publicar seu boleto, ele aparece aqui e você recebe um aviso." /></Card>
      ) : (
        <div className="space-y-6">
          {open.length > 0 && (
            <section aria-labelledby="h-open">
              <h2 id="h-open" className="heading mb-3 text-lg font-bold">Em aberto</h2>
              <Card className="divide-y divide-cream overflow-hidden">{open.map((i, n) => <Detail key={i.id} i={i} expanded={n === 0} />)}</Card>
            </section>
          )}
          <section aria-labelledby="h-hist">
            <h2 id="h-hist" className="heading mb-3 text-lg font-bold">Histórico de pagamentos</h2>
            <Card className="divide-y divide-cream overflow-hidden">
              {history.length ? history.map((i) => <Detail key={i.id} i={i} />) : <p className="px-6 py-8 text-sm text-stone">Nenhum pagamento registrado ainda.</p>}
            </Card>
          </section>
        </div>
      )}
    </>
  );
}
