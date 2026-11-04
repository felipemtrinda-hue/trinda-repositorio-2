import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, FileText, Trash2, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { archiveProperty, deletePhoto, unlinkOwner } from "@/lib/actions/properties";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { PropertyForm } from "@/components/admin/property-form";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { LinkOwnerForm } from "@/components/admin/link-owner-form";
import { date, money, moneyInput } from "@/lib/format";
import { leaseStatus, propertyStatus } from "@/lib/labels";

export const metadata: Metadata = { title: "Imóvel" };

const str = (v: unknown) => (v == null ? undefined : Array.isArray(v) ? v.join(", ") : String(v));

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();

  const [{ data: photos }, { data: links }, { data: owners }, { data: leases }] = await Promise.all([
    supabase.from("property_photos").select("id, storage_path, caption").eq("property_id", id).order("position"),
    supabase.from("property_owners").select("owner_id, share_pct, owner:profiles(full_name, email)").eq("property_id", id),
    supabase.from("profiles").select("id, full_name").eq("role", "owner").neq("status", "blocked").order("full_name"),
    supabase.from("leases").select("id, status, start_date, end_date, rent_amount, tenant:profiles(full_name)").eq("property_id", id).order("start_date", { ascending: false }),
  ]);

  // Fotos do bucket privado: URLs assinadas válidas por 1 hora
  const signed = photos?.length
    ? (await supabase.storage.from("imoveis").createSignedUrls(photos.map((f) => f.storage_path), 3600)).data ?? []
    : [];
  const linkedIds = new Set(links?.map((l) => l.owner_id));
  const remaining = 100 - (links?.reduce((s, l) => s + Number(l.share_pct), 0) ?? 0);
  const [statusLabel, statusTone] = propertyStatus[p.status] ?? [p.status, "neutral"];

  const initial = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, str(v)]));
  for (const k of ["rent_amount", "condo_amount", "iptu_amount"] as const) initial[k] = moneyInput(p[k]);
  if (p.area_m2 != null) initial.area_m2 = String(Number(p.area_m2)).replace(".", ",");
  if (p.zip_code) initial.zip_code = String(p.zip_code).replace(/(\d{5})(\d{3})/, "$1-$2");

  return (
    <>
      <Link href="/admin/imoveis" className="mb-4 inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal"><ArrowLeft className="size-4" /> Imóveis</Link>
      <PageHeader eyebrow={p.code ? `Imóvel #${p.code}` : "Imóvel"} title={p.title}
        description={[p.street, p.number, p.district, `${p.city}/${p.state}`].filter(Boolean).join(", ")}
        actions={<>
          <Badge tone={statusTone}>{statusLabel}</Badge>
          {p.status !== "archived" && (
            <form>
              <input type="hidden" name="id" value={p.id} />
              <ConfirmSubmit size="sm" formAction={archiveProperty} title="Arquivar imóvel?" confirmLabel="Arquivar"
                message="O imóvel sai da carteira e deixa de aparecer para proprietários e inquilinos. O histórico é mantido.">
                <Archive className="size-4" /> Arquivar
              </ConfirmSubmit>
            </form>
          )}
        </>} />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <FormSection title="Fotos" description="Visíveis para o proprietário e o inquilino do imóvel.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos?.map((ph, i) => (
                <figure key={ph.id} className="group relative aspect-[4/3] overflow-hidden rounded-[20px] bg-mist">
                  {signed[i]?.signedUrl && <Image src={signed[i].signedUrl} alt={ph.caption ?? `Foto ${i + 1} de ${p.title}`} fill sizes="240px" className="object-cover" unoptimized />}
                  <form action={deletePhoto} className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    <input type="hidden" name="id" value={ph.id} /><input type="hidden" name="property_id" value={p.id} />
                    <button className="glass grid size-9 place-items-center rounded-full text-danger" aria-label="Remover foto"><Trash2 className="size-4" /></button>
                  </form>
                </figure>
              ))}
              <PhotoUploader propertyId={p.id} />
            </div>
          </FormSection>
          <PropertyForm initial={initial} />
        </div>

        <aside className="space-y-4">
          <FormSection title="Proprietários" description={remaining < 100 ? `${100 - remaining}% vinculados` : undefined}>
            <ul className="mb-5 space-y-2">
              {links?.map((l) => {
                const o = (Array.isArray(l.owner) ? l.owner[0] : l.owner) as { full_name: string; email: string } | null;
                return (
                  <li key={l.owner_id} className="flex items-center justify-between gap-3 rounded-[18px] bg-mist p-3">
                    <Link href={`/admin/pessoas/${l.owner_id}`} className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-paper text-bordo"><UserRound className="size-4" /></span>
                      <span className="min-w-0 text-sm"><span className="block truncate font-semibold">{o?.full_name}</span><span className="block text-xs text-stone">{Number(l.share_pct)}% de participação</span></span>
                    </Link>
                    <form>
                      <input type="hidden" name="property_id" value={p.id} /><input type="hidden" name="owner_id" value={l.owner_id} />
                      <ConfirmSubmit size="sm" formAction={unlinkOwner} title="Remover vínculo?" confirmLabel="Remover"
                        message={`${o?.full_name} deixará de ver este imóvel e seus documentos.`}>
                        <Trash2 className="size-4" />
                      </ConfirmSubmit>
                    </form>
                  </li>
                );
              })}
              {!links?.length && <li className="text-sm text-stone">Nenhum proprietário vinculado.</li>}
            </ul>
            {remaining > 0 && (
              <LinkOwnerForm propertyId={p.id} remaining={remaining}
                owners={(owners ?? []).filter((o) => !linkedIds.has(o.id)).map((o) => ({ value: o.id, label: o.full_name }))} />
            )}
          </FormSection>

          <FormSection title="Contratos" aside={<ButtonLink href={`/admin/contratos/novo?imovel=${p.id}`} size="sm" variant="secondary">Novo</ButtonLink>}>
            <ul className="space-y-2">
              {leases?.map((l) => {
                const t = (Array.isArray(l.tenant) ? l.tenant[0] : l.tenant) as { full_name: string } | null;
                const [label, tone] = leaseStatus[l.status] ?? [l.status, "neutral"];
                return (
                  <li key={l.id}>
                    <Link href={`/admin/contratos/${l.id}`} className="flex items-center justify-between gap-3 rounded-[18px] bg-mist p-3 hover:bg-[#ededf1]">
                      <span className="flex min-w-0 items-center gap-3">
                        <FileText className="size-4 shrink-0 text-bordo" />
                        <span className="min-w-0 text-sm"><span className="block truncate font-semibold">{t?.full_name}</span>
                          <span className="block text-xs text-stone">{date(l.start_date)} – {date(l.end_date)} · {money(l.rent_amount)}</span></span>
                      </span>
                      <Badge tone={tone}>{label}</Badge>
                    </Link>
                  </li>
                );
              })}
              {!leases?.length && <li className="text-sm text-stone">Nenhum contrato registrado.</li>}
            </ul>
          </FormSection>
        </aside>
      </div>
    </>
  );
}
