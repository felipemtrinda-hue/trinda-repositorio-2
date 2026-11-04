import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Bell, Building2, FileText, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { date, relative } from "@/lib/format";
import { propertyStatus } from "@/lib/labels";

export const metadata: Metadata = { title: "Início" };

const DOC_KIND: Record<string, string> = { receipt: "Recibo", statement: "Demonstrativo", income_tax: "Imposto de Renda", contract: "Contrato", other: "Documento" };

export default async function OwnerHome() {
  const profile = (await getProfile())!;
  const supabase = await createClient();
  // A RLS já limita cada consulta aos imóveis deste proprietário.
  const [{ data: properties }, { data: docs }, { data: notes }] = await Promise.all([
    supabase.from("properties").select("id, title, status, street, number, district, city").order("title"),
    supabase.from("documents").select("id, title, kind, published_at, base_year").order("published_at", { ascending: false }).limit(5),
    supabase.from("notifications").select("id, title, created_at, read_at").order("created_at", { ascending: false }).limit(4),
  ]);
  const rented = properties?.filter((p) => p.status === "rented").length ?? 0;
  const ir = docs?.find((d) => d.kind === "income_tax");

  return (
    <>
      <PageHeader eyebrow="Área do proprietário" title={`Olá, ${profile.full_name.split(" ")[0]}.`} accent="Seus imóveis em dia." />

      <section className="stagger grid gap-4 sm:grid-cols-3">
        <StatCard tone="vinho" icon={Building2} label="Imóveis" value={properties?.length ?? 0} hint={`${rented} alugados`} />
        <StatCard icon={Receipt} label="Documentos recentes" value={docs?.length ?? 0} hint="Recibos e demonstrativos" />
        <StatCard tone="accent" icon={FileText} label="Imposto de Renda" value={ir ? `${ir.base_year}` : "—"}
          hint={ir ? `Publicado em ${date(ir.published_at)}` : "Aguardando publicação anual"} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Meus imóveis" action={<Link href="/proprietario/imoveis" className="inline-flex items-center gap-1 text-sm font-medium text-bordo">Ver todos <ArrowUpRight className="size-3.5" /></Link>} />
          {!properties?.length ? (
            <EmptyState icon={Building2} title="Nenhum imóvel vinculado" description="Quando a Empiric vincular seus imóveis, eles aparecerão aqui." />
          ) : (
            <ul className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
              {properties.map((p) => {
                const [label, tone] = propertyStatus[p.status] ?? [p.status, "neutral"];
                return (
                  <li key={p.id} className="rounded-2xl border border-cream p-4">
                    <div className="mb-2 flex items-start justify-between gap-2"><p className="font-medium">{p.title}</p><Badge tone={tone}>{label}</Badge></div>
                    <p className="text-sm text-stone">{[p.street, p.number].filter(Boolean).join(", ")}{p.district ? ` · ${p.district}` : ""} · {p.city}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Avisos" icon={<Bell className="size-4 text-bordo" />} />
          {!notes?.length ? <EmptyState icon={Bell} title="Tudo tranquilo" description="Avisos de repasses e documentos aparecem aqui." /> : (
            <ul className="divide-y divide-cream px-6 pb-3">
              {notes.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className={n.read_at ? "text-stone" : "font-medium"}>{n.title}</span>
                  <time className="shrink-0 text-xs text-stone">{relative(n.created_at)}</time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card className="mt-4">
        <CardHeader title="Últimos documentos" action={<Link href="/proprietario/documentos" className="text-sm font-medium text-bordo">Biblioteca</Link>} />
        {!docs?.length ? <EmptyState icon={FileText} title="Nenhum documento publicado" description="Recibos mensais e o informe de IR ficarão disponíveis aqui." /> : (
          <ul className="divide-y divide-cream px-6 pb-3">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                <span className="flex items-center gap-3"><FileText className="size-4 text-bordo" aria-hidden />{d.title}</span>
                <span className="flex items-center gap-3 text-sm text-stone"><Badge tone="brand">{DOC_KIND[d.kind] ?? "Documento"}</Badge>{date(d.published_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
