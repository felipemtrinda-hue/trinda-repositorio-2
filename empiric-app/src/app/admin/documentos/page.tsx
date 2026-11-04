import { EyeOff, FolderOpen, Plus, Send, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteDocument, setDocumentPublished } from "@/lib/actions/documents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { DocActions } from "@/components/documents/doc-actions";
import { DOC_KIND_LABEL } from "@/lib/documents";
import { date, monthYear } from "@/lib/format";

export const metadata = { title: "Documentos" };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ tipo?: string; status?: string }> }) {
  const { tipo = "", status = "" } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("documents")
    .select("id, title, kind, published_at, base_year, competence, created_at, property:properties(title), recipient:profiles!documents_recipient_id_fkey(full_name)")
    .neq("kind", "invoice").order("created_at", { ascending: false }).limit(200);
  if (tipo) q = q.eq("kind", tipo);
  if (status === "rascunho") q = q.is("published_at", null);
  if (status === "publicado") q = q.not("published_at", "is", null);
  const { data: docs } = await q;
  const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
  const back = new URLSearchParams({ ...(tipo && { tipo }), ...(status && { status }) }).toString();

  return (
    <>
      <PageHeader eyebrow="Biblioteca" title="Documentos" accent="dos clientes"
        description="Contratos, laudos, recibos, demonstrativos e informes de Imposto de Renda."
        actions={<ButtonLink href="/admin/documentos/novo"><Plus className="size-4" /> Enviar documento</ButtonLink>} />
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="tipo" defaultValue={tipo} className="h-10 rounded-full bg-mist px-4 text-sm" aria-label="Tipo">
          <option value="">Todos os tipos</option>
          {Object.entries(DOC_KIND_LABEL).filter(([k]) => k !== "invoice").map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select name="status" defaultValue={status} className="h-10 rounded-full bg-mist px-4 text-sm" aria-label="Situação">
          <option value="">Publicados e rascunhos</option><option value="publicado">Publicados</option><option value="rascunho">Rascunhos</option>
        </select>
        <button className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">Filtrar</button>
      </form>
      <Card className="overflow-hidden">
        {!docs?.length ? (
          <EmptyState icon={FolderOpen} title="Nenhum documento" description="Envie contratos, recibos e informes de IR para os clientes."
            action={<ButtonLink href="/admin/documentos/novo"><Plus className="size-4" /> Enviar documento</ButtonLink>} />
        ) : (
          <ul className="divide-y divide-cream">
            {docs.map((d) => {
              const to = (one(d.recipient) as { full_name: string } | null)?.full_name ?? (one(d.property) as { title: string } | null)?.title ?? "—";
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-4 md:px-6">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{d.title}</span>
                    <span className="block truncate text-xs text-stone">
                      {DOC_KIND_LABEL[d.kind]}{d.base_year ? ` ${d.base_year}` : ""}{d.competence ? ` · ${monthYear(d.competence)}` : ""} · {to} · {date(d.created_at)}
                    </span>
                  </span>
                  <Badge tone={d.published_at ? "success" : "warning"}>{d.published_at ? "Publicado" : "Rascunho"}</Badge>
                  <DocActions id={d.id} compact />
                  <form className="flex gap-1.5">
                    <input type="hidden" name="id" value={d.id} /><input type="hidden" name="back" value={back} />
                    <input type="hidden" name="publish" value={d.published_at ? "0" : "1"} />
                    <button formAction={setDocumentPublished} className="grid size-9 place-items-center rounded-full bg-mist hover:bg-[#ebebef]"
                      aria-label={d.published_at ? "Ocultar dos clientes" : "Publicar"} title={d.published_at ? "Ocultar dos clientes" : "Publicar"}>
                      {d.published_at ? <EyeOff className="size-4" /> : <Send className="size-4 text-bordo" />}
                    </button>
                    <ConfirmSubmit size="sm" formAction={deleteDocument} title="Excluir documento?" confirmLabel="Excluir"
                      message="O arquivo será apagado definitivamente e deixará de aparecer para os clientes.">
                      <Trash2 className="size-4" />
                    </ConfirmSubmit>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
