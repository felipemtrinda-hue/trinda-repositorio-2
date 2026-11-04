import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PersonForm } from "@/components/admin/person-form";

export const metadata = { title: "Novo cadastro" };

export default async function Page({ searchParams }: { searchParams: Promise<{ papel?: string }> }) {
  const { papel } = await searchParams;
  const role = papel === "owner" ? "owner" : "tenant";
  const back = role === "owner" ? ["/admin/proprietarios", "Proprietários"] : ["/admin/inquilinos", "Inquilinos"];
  return (
    <>
      <Link href={back[0]} className="mb-4 inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal"><ArrowLeft className="size-4" /> {back[1]}</Link>
      <PageHeader eyebrow="Cadastros" title="Novo" accent={role === "owner" ? "proprietário" : "inquilino"} />
      <div className="max-w-3xl"><PersonForm role={role} /></div>
    </>
  );
}
