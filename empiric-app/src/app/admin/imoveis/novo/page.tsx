import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PropertyForm } from "@/components/admin/property-form";

export const metadata: Metadata = { title: "Novo imóvel" };

export default function NewPropertyPage() {
  return (
    <>
      <Link href="/admin/imoveis" className="mb-4 inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal"><ArrowLeft className="size-4" /> Imóveis</Link>
      <PageHeader eyebrow="Carteira" title="Novo" accent="imóvel" description="Depois de salvar, você poderá adicionar fotos e vincular proprietários." />
      <PropertyForm />
    </>
  );
}
