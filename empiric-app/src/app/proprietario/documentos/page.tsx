import { FileText, Landmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DocList, type DocRow } from "@/components/documents/doc-list";

export const metadata = { title: "Documentos" };

export default async function OwnerDocs() {
  const supabase = await createClient();
  const { data } = await supabase.from("documents")
    .select("id, title, kind, mime_type, size_bytes, published_at, base_year, competence")
    .not("kind", "in", "(receipt,statement,invoice)").order("published_at", { ascending: false });
  const docs = (data ?? []) as DocRow[];
  const ir = docs.filter((d) => d.kind === "income_tax").sort((a, b) => (b.base_year ?? 0) - (a.base_year ?? 0));
  const other = docs.filter((d) => d.kind !== "income_tax");
  return (
    <>
      <PageHeader eyebrow="Biblioteca" title="Seus" accent="documentos" />
      <div className="space-y-6">
        <section>
          <h2 className="heading mb-3 flex items-center gap-2 text-lg font-bold"><Landmark className="size-5 text-bordo" /> Imposto de Renda</h2>
          <Card className="overflow-hidden">
            {ir.length ? <DocList docs={ir} /> : <EmptyState icon={Landmark} title="Informe ainda não publicado" description="A Empiric publica o informe de rendimentos uma vez por ano. Você recebe um aviso quando estiver disponível." />}
          </Card>
        </section>
        <section>
          <h2 className="heading mb-3 text-lg font-bold">Contratos e outros</h2>
          <Card className="overflow-hidden">
            {other.length ? <DocList docs={other} /> : <EmptyState icon={FileText} title="Nenhum documento" description="Contratos e demais arquivos dos seus imóveis aparecerão aqui." />}
          </Card>
        </section>
      </div>
    </>
  );
}
