import type { Metadata } from "next";
import { Building2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { money } from "@/lib/format";
import { propertyStatus } from "@/lib/labels";

export const metadata: Metadata = { title: "Imóveis" };

const FILTERS = [["", "Todos"], ["rented", "Alugados"], ["available", "Disponíveis"], ["reserved", "Reservados"], ["maintenance", "Manutenção"]] as const;

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("properties")
    .select("id, code, title, status, street, number, district, city, state, rent_amount, bedrooms, area_m2")
    .neq("status", "archived").order("created_at", { ascending: false }).limit(100);
  if (status) query = query.eq("status", status);
  if (q) {
    const term = q.replace(/[%,()]/g, " ").trim();
    query = query.or(`title.ilike.%${term}%,street.ilike.%${term}%,district.ilike.%${term}%,code.ilike.%${term}%`);
  }
  const { data: rows } = await query;

  return (
    <>
      <PageHeader eyebrow="Carteira" title="Imóveis" accent="administrados"
        description="Cadastro completo com fotos, proprietários e contrato vigente entra na Etapa 2." />

      <form className="mb-4 flex flex-col gap-3 md:flex-row md:items-center" role="search">
        <label className="relative flex-1">
          <span className="sr-only">Buscar imóvel</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Buscar por título, endereço, bairro ou código"
            className="h-11 w-full rounded-full border border-cream bg-paper pl-11 pr-4 text-sm focus:border-bordo focus:outline-none" />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(([v, label]) => (
            <button key={v} name="status" value={v}
              className={`h-9 shrink-0 rounded-full px-4 text-sm ${status === v ? "bg-vinho text-white" : "border border-cream bg-paper text-graphite hover:border-rose-line"}`}>
              {label}
            </button>
          ))}
        </div>
      </form>

      <Card className="overflow-hidden">
        {!rows?.length ? (
          <EmptyState icon={Building2} title={q || status ? "Nenhum imóvel encontrado" : "Nenhum imóvel cadastrado"}
            description={q || status ? "Ajuste a busca ou os filtros." : "Os imóveis cadastrados pela equipe aparecerão aqui."} />
        ) : (
          <table className="w-full text-sm">
            <thead className="hidden bg-canvas text-left text-xs uppercase tracking-wider text-stone md:table-header-group">
              <tr><th className="px-6 py-3 font-medium">Imóvel</th><th className="px-6 py-3 font-medium">Endereço</th>
                <th className="px-6 py-3 font-medium">Aluguel</th><th className="px-6 py-3 font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-cream">
              {rows.map((p) => {
                const [label, tone] = propertyStatus[p.status] ?? [p.status, "neutral"];
                return (
                  <tr key={p.id} className="flex flex-col gap-1 px-6 py-4 hover:bg-canvas md:table-row md:p-0">
                    <td className="md:px-6 md:py-4"><p className="font-medium">{p.title}</p>{p.code && <p className="text-xs text-stone">#{p.code}</p>}</td>
                    <td className="text-stone md:px-6 md:py-4">{[p.street, p.number].filter(Boolean).join(", ")} · {p.district ? `${p.district}, ` : ""}{p.city}/{p.state}</td>
                    <td className="md:px-6 md:py-4">{p.rent_amount ? money(p.rent_amount) : "—"}</td>
                    <td className="md:px-6 md:py-4"><Badge tone={tone}>{label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
