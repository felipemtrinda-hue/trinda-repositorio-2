import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DocUploader } from "@/components/documents/doc-uploader";
import { adminOptions } from "@/lib/admin-options";

export const metadata = { title: "Enviar documento" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tipo?: string; imovel?: string; contrato?: string; pessoa?: string }> }) {
  const sp = await searchParams;
  const opts = await adminOptions();
  const lease = opts.leases.find((l) => l.value === sp.contrato);
  return (
    <>
      <Link href="/admin/documentos" className="mb-4 inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal"><ArrowLeft className="size-4" /> Documentos</Link>
      <PageHeader eyebrow="Documentos" title="Enviar" accent="documento" />
      <div className="max-w-3xl">
        <DocUploader {...opts} initial={{ kind: sp.tipo, property_id: lease?.property_id ?? sp.imovel, lease_id: sp.contrato, recipient_id: sp.pessoa }} />
      </div>
    </>
  );
}
