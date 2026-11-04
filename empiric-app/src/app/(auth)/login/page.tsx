import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, HOME_BY_ROLE } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const NOTICES: Record<string, string> = {
  bloqueado: "Seu acesso está bloqueado. Fale com a Empiric.",
  link: "O link expirou ou já foi usado. Solicite um novo.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; erro?: string }> }) {
  const { next, erro } = await searchParams;
  const profile = await getProfile();
  if (profile && profile.status !== "blocked") redirect(HOME_BY_ROLE[profile.role]);

  return (
    <>
      <p className="eyebrow mb-3">Bem-vindo de volta</p>
      <h2 className="display mb-2 text-[44px]">Acesse sua <em>conta</em></h2>
      <p className="mb-8 text-stone">Use o e-mail cadastrado na Empiric.</p>
      {!isSupabaseConfigured && <div className="mb-6"><SetupNotice /></div>}
      <LoginForm next={next} notice={erro ? NOTICES[erro] : undefined} />
      <p className="mt-8 text-center text-sm text-stone">
        Primeiro acesso? Use o link do convite enviado para o seu e-mail.
      </p>
    </>
  );
}
