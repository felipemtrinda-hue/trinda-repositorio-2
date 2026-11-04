import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, Send, Undo2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cancelInvoice, deletePayment, publishInvoice } from "@/lib/actions/invoices";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { FormSection } from "@/components/ui/form";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { DocActions } from "@/components/documents/doc-actions";
import { PaymentForm } from "@/components/admin/payment-form";
import { CopyField } from "@/components/ui/copy-field";
import { date, money, monthYear } from "@/lib/format";
import { invoiceStatus } from "@/lib/labels";
import { todaySP } from "@/lib/dates";

export const metadata = { title: "Boleto" };
const METHOD: Record<string, string> = { pix: "Pix", boleto: "Boleto", transferencia: "Transferência", dinheiro: "Dinheiro", outro: "Outro" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices")
    .select("*, lease:leases(id, property:properties(title), tenant:profiles(full_name)), items:invoice_items(id, label, amount, position), payments(id, amount, paid_at, method, source)")
    .eq("id", id).maybeSingle();
  if (!inv) notFound();
  const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
  const lease = one(inv.lease) as { id: string; property: { title: string }; tenant: { full_name: string } };
  const items = [...(inv.items ?? [])].sort((a, b) => a.position - b.position);
  const paid = (inv.payments ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0);
  const remaining = Math.max(0, Number(inv.amount) - paid);
  const [label, tone] = invoiceStatus[inv.status];
  const open = inv.status === "pending" || inv.status === "overdue";

  return (
    <>
      <Link href="/admin/financeiro" className="mb-4 inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal"><ArrowLeft className="size-4" /> Boletos</Link>
      <PageHeader eyebrow={`Competência ${monthYear(inv.competence)}`} title={money(inv.amount)}
        description={`${one(lease.property)?.title} · ${one(lease.tenant)?.full_name} · vencimento ${date(inv.due_date)}`}
        actions={<>
          {!inv.published_at && <Badge tone="warning">Rascunho</Badge>}
          <Badge tone={tone}>{label}</Badge>
        </>} />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <FormSection title="Itens">
            <ul className="divide-y divide-cream text-[15px]">
              {items.map((i) => <li key={i.id} className="flex justify-between gap-4 py-2.5"><span>{i.label}</span><span className="tabular-nums">{money(i.amount)}</span></li>)}
              <li className="flex justify-between gap-4 pt-3 font-bold"><span>Total</span><span className="tabular-nums">{money(inv.amount)}</span></li>
            </ul>
          </FormSection>
          {(inv.barcode || inv.pix_code || inv.document_id) && (
            <FormSection title="Formas de pagamento">
              <div className="space-y-3">
                {inv.barcode && <CopyField label="Linha digitável" value={inv.barcode} />}
                {inv.pix_code && <CopyField label="Pix copia e cola" value={inv.pix_code} />}
                {inv.document_id && <div className="flex items-center justify-between rounded-[16px] bg-mist px-4 py-3 text-sm"><span className="font-semibold">PDF do boleto</span><DocActions id={inv.document_id} /></div>}
              </div>
            </FormSection>
          )}
          <FormSection title="Pagamentos" description={paid ? `${money(paid)} recebidos${remaining ? ` · faltam ${money(remaining)}` : ""}` : undefined}>
            <ul className="space-y-2">
              {(inv.payments ?? []).map((p: { id: string; amount: number; paid_at: string; method: string; source: string }) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-[16px] bg-mist px-4 py-3 text-sm">
                  <span><span className="font-semibold tabular-nums">{money(p.amount)}</span> · {METHOD[p.method] ?? p.method} · {date(p.paid_at)}{p.source === "webhook" && " · automático"}</span>
                  {p.source === "manual" && (
                    <form>
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="invoice_id" value={inv.id} />
                      <ConfirmSubmit size="sm" formAction={deletePayment} title="Estornar pagamento?" confirmLabel="Estornar"
                        message="O pagamento será removido e o boleto volta a ficar em aberto (ou vencido).">
                        <Undo2 className="size-4" />
                      </ConfirmSubmit>
                    </form>
                  )}
                </li>
              ))}
              {!inv.payments?.length && <li className="text-sm text-stone">Nenhum pagamento registrado.</li>}
            </ul>
          </FormSection>
        </div>

        <aside className="space-y-4">
          {open && <FormSection title="Registrar pagamento" description="O boleto é baixado automaticamente quando o total é atingido."><PaymentForm invoiceId={inv.id} remaining={remaining} today={todaySP()} /></FormSection>}
          {(!inv.published_at || open) && (
            <FormSection title="Ações">
              <div className="space-y-2 [&_button]:w-full">
                {!inv.published_at && inv.status !== "cancelled" && (
                  <form><input type="hidden" name="id" value={inv.id} />
                    <ConfirmSubmit formAction={publishInvoice} variant="primary" title="Publicar boleto?" confirmLabel="Publicar"
                      message="O inquilino passa a ver o boleto no app e recebe um aviso. Os lembretes de vencimento começam a contar.">
                      <Send className="size-4" /> Publicar para o inquilino
                    </ConfirmSubmit>
                  </form>
                )}
                {open && (
                  <form><input type="hidden" name="id" value={inv.id} />
                    <ConfirmSubmit formAction={cancelInvoice} title="Cancelar boleto?" confirmLabel="Cancelar boleto"
                      message="O boleto deixa de cobrar e não gera mais lembretes. Cancele também no banco emissor.">
                      <Ban className="size-4" /> Cancelar boleto
                    </ConfirmSubmit>
                  </form>
                )}
              </div>
            </FormSection>
          )}
        </aside>
      </div>
    </>
  );
}
