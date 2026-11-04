import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FileText, Lock, LockOpen, Mail, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { setBlocked } from "@/lib/actions/people";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { PersonForm } from "@/components/admin/person-form";
import { AccessLink } from "@/components/admin/access-link";
import { date, money } from "@/lib/format";
import { accountStatus, leaseStatus, propertyStatus } from "@/lib/labels";

export const metadata = { title: "Cadastro" };

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const me = await getProfile();
  const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!p || p.role === "admin") notFound();
  const isOwner = p.role === "owner";

  const [{ data: props }, { data: leases }] = await Promise.all([
    isOwner
      ? supabase.from("property_owners").select("share_pct, property:properties(id, title, status, city)").eq("owner_id", id)
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("leases").select("id, status, start_date, end_date, rent_amount, property:properties(id, title)")
      .eq("tenant_id", id).order("start_date", { ascending: false }),
  ]);
  const [statusLabel, statusTone] = accountStatus[p.status];
  const blocked = p.status === "blocked";
  const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);

  return (
    <>
      <Link href={isOwner ? "/admin/proprietarios" : "/admin/inquilinos"} className="mb-4 inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal">
        <ArrowLeft className="size-4" /> {isOwner ? "Proprietários" : "Inquilinos"}
      </Link>
      <PageHeader eyebrow={isOwner ? "Proprietário" : "Inquilino"} title={p.full_name} actions={<Badge tone={statusTone}>{statusLabel}</Badge>} />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <PersonForm role={p.role} initial={{ id: p.id, full_name: p.full_name, email: p.email, phone: p.phone ?? "", whatsapp: p.whatsapp ?? "", document_id: p.document_id ?? "", notes: p.notes ?? "" }} />

          {isOwner ? (
            <FormSection title="Imóveis vinculados" description="O vínculo é feito na página do imóvel.">
              <ul className="space-y-2">
                {props?.map((r) => {
                  const pr = one(r.property) as { id: string; title: string; status: string; city: string };
                  const [l, t] = propertyStatus[pr.status] ?? [pr.status, "neutral"];
                  return (
                    <li key={pr.id}><Link href={`/admin/imoveis/${pr.id}`} className="flex items-center justify-between gap-3 rounded-[18px] bg-mist p-3 hover:bg-[#ededf1]">
                      <span className="flex items-center gap-3 text-sm"><Building2 className="size-4 text-bordo" /><span><span className="block font-semibold">{pr.title}</span><span className="text-xs text-stone">{pr.city} · {Number(r.share_pct)}%</span></span></span>
                      <Badge tone={t}>{l}</Badge>
                    </Link></li>
                  );
                })}
                {!props?.length && <li className="text-sm text-stone">Nenhum imóvel vinculado ainda.</li>}
              </ul>
            </FormSection>
          ) : (
            <FormSection title="Contratos" aside={<ButtonLink href={`/admin/contratos/novo?inquilino=${p.id}`} size="sm" variant="secondary">Novo contrato</ButtonLink>}>
              <ul className="space-y-2">
                {leases?.map((l) => {
                  const pr = one(l.property) as { id: string; title: string };
                  const [lb, t] = leaseStatus[l.status];
                  return (
                    <li key={l.id}><Link href={`/admin/contratos/${l.id}`} className="flex items-center justify-between gap-3 rounded-[18px] bg-mist p-3 hover:bg-[#ededf1]">
                      <span className="flex items-center gap-3 text-sm"><FileText className="size-4 text-bordo" /><span><span className="block font-semibold">{pr?.title}</span><span className="text-xs text-stone">{date(l.start_date)} – {date(l.end_date)} · {money(l.rent_amount)}</span></span></span>
                      <Badge tone={t}>{lb}</Badge>
                    </Link></li>
                  );
                })}
                {!leases?.length && <li className="text-sm text-stone">Nenhum contrato ainda.</li>}
              </ul>
            </FormSection>
          )}
        </div>

        <aside className="space-y-4">
          <FormSection title="Contato">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3"><Mail className="size-4 text-stone" /><a href={`mailto:${p.email}`} className="hover:text-bordo">{p.email}</a></li>
              {p.phone && <li className="flex items-center gap-3"><Phone className="size-4 text-stone" />{p.phone}</li>}
              {p.whatsapp && <li className="flex items-center gap-3"><MessageCircle className="size-4 text-stone" /><a href={`https://wa.me/55${p.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-bordo">{p.whatsapp}</a></li>}
            </ul>
          </FormSection>
          <FormSection title="Acesso ao portal"
            description={p.status === "invited" ? "Convite enviado — aguardando o primeiro acesso." : p.lgpd_consent_at ? `Consentimento LGPD em ${date(p.lgpd_consent_at)}.` : undefined}>
            <div className="space-y-3">
              {!blocked && <AccessLink userId={p.id} />}
              {me?.id !== p.id && (
                <form>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="block" value={blocked ? "0" : "1"} />
                  <div className="[&>button]:w-full">
                    <ConfirmSubmit formAction={setBlocked} variant={blocked ? "secondary" : "danger"}
                      title={blocked ? "Liberar acesso?" : "Bloquear acesso?"} confirmLabel={blocked ? "Liberar" : "Bloquear"}
                      message={blocked ? `${p.full_name} poderá entrar novamente no portal.` : `${p.full_name} será desconectado e não verá mais nenhum dado. O cadastro e o histórico são mantidos.`}>
                      {blocked ? <><LockOpen className="size-4" /> Liberar acesso</> : <><Lock className="size-4" /> Bloquear acesso</>}
                    </ConfirmSubmit>
                  </div>
                </form>
              )}
            </div>
          </FormSection>
        </aside>
      </div>
    </>
  );
}
