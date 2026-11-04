import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DocList, type DocRow } from "@/components/documents/doc-list";

export const metadata = { title: "Contrato e vistoria" };

export default async function TenantDocs() {
  const supabase = await createClient();
  const { data } = await supabase.from("documents")
    .select("id, title, kind, mime_type, size_bytes, published_at, base_year, competence")
    .neq("kind", "invoice").order("published_at", { ascending: false });
  const docs = (data ?? []) as DocRow[];
  const main = docs.filter((d) => d.kind === "contract" || d.kind === "inspection");
  const other = docs.filter((d) => !main.includes(d));
  return (
    <>
      <PageHeader eyebrow="Documentos" title="Contrato" accent="e vistoria" description="Consulte e baixe quando precisar. Os arquivos abrem por um link seguro e temporário." />
      <div className="space-y-6">
        <Card className="overflow-hidden">
          {main.length ? <DocList docs={main} /> : <EmptyState icon={FileText} title="Contrato ainda não publicado" description="Assim que a Empiric anexar o contrato assinado e o laudo de vistoria, eles aparecem aqui." />}
        </Card>
        {other.length > 0 && (
          <section><h2 className="heading mb-3 text-lg font-bold">Outros documentos</h2><Card className="overflow-hidden"><DocList docs={other} /></Card></section>
        )}
      </div>
    </>
  );
}
