import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { accountStatus } from "@/lib/labels";

const COPY = {
  owner: { title: "Proprietários", accent: "e vínculos", one: "proprietário", rel: "imóvel(is)" },
  tenant: { title: "Inquilinos", accent: "e locações", one: "inquilino", rel: "contrato(s) ativo(s)" },
};

export async function PeopleList({ role, q = "" }: { role: "owner" | "tenant"; q?: string }) {
  const supabase = await createClient();
  const c = COPY[role];
  let query = supabase.from("profiles").select("id, full_name, email, phone, whatsapp, status").eq("role", role).order("full_name").limit(200);
  const term = q.replace(/[%,()]/g, " ").trim();
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,document_id.ilike.%${term.replace(/\D/g, "") || term}%`);
  const { data: people } = await query;

  const ids = people?.map((p) => p.id) ?? [];
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data } = role === "owner"
      ? await supabase.from("property_owners").select("owner_id").in("owner_id", ids)
      : await supabase.from("leases").select("tenant_id").eq("status", "active").in("tenant_id", ids);
    data?.forEach((r: Record<string, string>) => { const k = r.owner_id ?? r.tenant_id; counts.set(k, (counts.get(k) ?? 0) + 1); });
  }

  return (
    <>
      <PageHeader eyebrow="Cadastros" title={c.title} accent={c.accent}
        actions={<ButtonLink href={`/admin/pessoas/novo?papel=${role}`}><Plus className="size-4" /> Novo {c.one}</ButtonLink>} />
      <form className="mb-4" role="search">
        <label className="relative block">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Buscar por nome, e-mail ou CPF"
            className="h-12 w-full rounded-full bg-mist pl-11 pr-4 text-sm focus:bg-paper focus:shadow-[0_0_0_4px_var(--color-rose-mist)] focus:outline-none" />
        </label>
      </form>
      <Card className="overflow-hidden">
        {!people?.length ? (
          <EmptyState icon={Users} title={term ? "Ninguém encontrado" : `Nenhum ${c.one} cadastrado`}
            description={term ? "Tente outro termo." : "Cadastre e envie o convite de acesso ao portal."}
            action={!term ? <ButtonLink href={`/admin/pessoas/novo?papel=${role}`}><Plus className="size-4" /> Novo {c.one}</ButtonLink> : undefined} />
        ) : (
          <ul className="divide-y divide-cream">
            {people.map((p) => {
              const [label, tone] = accountStatus[p.status];
              const initials = p.full_name.split(" ").filter(Boolean).slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();
              return (
                <li key={p.id}>
                  <Link href={`/admin/pessoas/${p.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-mist md:px-6">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-rose-mist text-sm font-semibold text-bordo">{initials}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.full_name}</span>
                      <span className="block truncate text-sm text-stone">{p.email}</span>
                    </span>
                    <span className="hidden text-sm text-stone sm:block">{counts.get(p.id) ?? 0} {c.rel}</span>
                    <Badge tone={tone}>{label}</Badge>
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
