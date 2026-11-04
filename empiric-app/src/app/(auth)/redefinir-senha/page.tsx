import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { NewPasswordForm } from "./form";

export const metadata: Metadata = { title: "Criar senha" };

export default async function ResetPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?erro=link");
  const firstAccess = profile.status === "invited";
  return (
    <>
      <p className="eyebrow mb-3">{firstAccess ? "Primeiro acesso" : "Segurança"}</p>
      <h2 className="display mb-2 text-[44px]">
        {firstAccess ? <>Bem-vindo, <em>{profile.full_name.split(" ")[0]}</em></> : <>Nova <em>senha</em></>}
      </h2>
      <p className="mb-8 text-stone">{firstAccess ? "Crie sua senha para ativar o acesso ao portal." : "Defina uma nova senha para sua conta."}</p>
      <NewPasswordForm firstAccess={firstAccess} />
    </>
  );
}
