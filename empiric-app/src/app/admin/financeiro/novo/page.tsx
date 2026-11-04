import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { adminOptions } from "@/lib/admin-options";

export const metadata = { title: "Novo boleto" };

export default async function Page({ searchParams }: { searchParams: Promise<{ contrato?: string }> }) {
  const { contrato } = await searchParams;
  const { leases } = await adminOptions();
  return (
    <>
      <Link href="/admin/financeiro" className="mb-4 inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal"><ArrowLeft className="size-4" /> Boletos</Link>
      <PageHeader eyebrow="Financeiro" title="Lançar" accent="boleto" description="Vencimento e aluguel vêm do contrato; ajuste se precisar." />
      <div className="max-w-3xl"><InvoiceForm leases={leases} initialLease={contrato} /></div>
    </>
  );
}
