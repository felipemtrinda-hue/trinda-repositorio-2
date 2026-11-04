import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LeaseForm } from "@/components/admin/lease-form";
import { leaseOptions } from "@/lib/lease-options";

export const metadata = { title: "Novo contrato" };

export default async function Page({ searchParams }: { searchParams: Promise<{ imovel?: string; inquilino?: string }> }) {
  const { imovel, inquilino } = await searchParams;
  const opts = await leaseOptions();
  return (
    <>
      <Link href="/admin/contratos" className="mb-4 inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal"><ArrowLeft className="size-4" /> Contratos</Link>
      <PageHeader eyebrow="Locação" title="Novo" accent="contrato" description="O contrato assinado e o laudo de vistoria são anexados na Etapa 3 (documentos)." />
      <div className="max-w-3xl"><LeaseForm {...opts} initial={{ property_id: imovel, tenant_id: inquilino }} /></div>
    </>
  );
}
