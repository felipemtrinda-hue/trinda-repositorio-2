import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, PenLine, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { setLeaseStatus } from "@/lib/actions/leases";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { FormSection } from "@/components/ui/form";
import { FormMessage } from "@/components/ui/field";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { LeaseForm } from "@/components/admin/lease-form";
import { leaseOptions } from "@/lib/lease-options";
import { date } from "@/lib/format";
import { leaseStatus } from "@/lib/labels";

export const metadata = { title: "Contrato" };

export default async function LeasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string }> }) {
  const [{ id }, { erro }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: l } = await supabase.from("leases").select("*, property:properties(title), tenant:profiles(full_name)").eq("id", id).maybeSingle();
  if (!l) notFound();
  const [opts, { data: events }] = await Promise.all([
    leaseOptions(),
    supabase.from("calendar_events").select("id, title, kind, starts_at").eq("lease_id", id).order("starts_at"),
  ]);
  const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
  const [label, tone] = leaseStatus[l.status];
  const initial = Object.fromEntries(Object.entries(l).filter(([, v]) => typeof v !== "object" || v === null).map(([k, v]) => [k, v == null ? "" : String(v)]));

  const transitions: { status: string; label: string; icon: typeof CheckCircle2; danger?: boolean; msg: string }[] = [];
  if (l.status === "draft") transitions.push({ status: "awaiting_signature", label: "Enviar para assinatura", icon: PenLine, msg: "O contrato fica aguardando assinatura. O inquilino já consegue ver o imóvel no portal." });
  if (l.status === "draft" || l.status === "awaiting_signature") transitions.push({ status: "active", label: "Ativar contrato", icon: CheckCircle2, msg: "O imóvel passa para “Alugado” e o inquilino recebe acesso completo." });
  if (l.status === "active") transitions.push({ status: "ended", label: "Encerrar contrato", icon: XCircle, danger: true, msg: "O imóvel volta para “Disponível”. O inquilino mantém o histórico, mas perde o acesso ao imóvel." });
  if (l.status !== "ended" && l.status !== "cancelled") transitions.push({ status: "cancelled", label: "Cancelar", icon: XCircle, danger: true, msg: "Use para contratos que não chegaram a valer. As datas saem da agenda." });

  return (
    <>
      <Link href="/admin/contratos" className="mb-4 inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal"><ArrowLeft className="size-4" /> Contratos</Link>
      <PageHeader eyebrow="Contrato de locação" title={(one(l.property) as { title: string })?.title ?? "Contrato"}
        description={`Inquilino: ${(one(l.tenant) as { full_name: string })?.full_name}`} actions={<Badge tone={tone}>{label}</Badge>} />
      {erro && <div className="mb-4"><FormMessage error={erro} /></div>}
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <LeaseForm {...opts} initial={initial} />
        <aside className="space-y-4">
          {transitions.length > 0 && (
            <FormSection title="Próximo passo">
              <div className="space-y-2">
                {transitions.map((t) => (
                  <form key={t.status} className="[&>button]:w-full">
                    <input type="hidden" name="id" value={l.id} /><input type="hidden" name="status" value={t.status} />
                    <ConfirmSubmit formAction={setLeaseStatus} variant={t.danger ? "danger" : "primary"} title={`${t.label}?`} message={t.msg} confirmLabel={t.label}>
                      <t.icon className="size-4" /> {t.label}
                    </ConfirmSubmit>
                  </form>
                ))}
              </div>
            </FormSection>
          )}
          <FormSection title="Na agenda">
            <ul className="space-y-2 text-sm">
              {events?.map((e) => (
                <li key={e.id} className="flex justify-between gap-3 rounded-[16px] bg-mist px-3 py-2.5"><span className="truncate">{e.title.split(" · ")[0]}</span><time className="shrink-0 text-stone">{date(e.starts_at)}</time></li>
              ))}
              {!events?.length && <li className="text-stone">Sem datas na agenda.</li>}
            </ul>
          </FormSection>
        </aside>
      </div>
    </>
  );
}
