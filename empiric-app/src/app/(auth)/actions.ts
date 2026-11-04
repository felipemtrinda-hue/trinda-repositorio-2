"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { HOME_BY_ROLE, type Role } from "@/lib/auth";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";

export type FormState = { error?: string; success?: string; fields?: Record<string, string> };

const email = z.string().trim().toLowerCase().email("Informe um e-mail válido.");

function safeNext(next: FormDataEntryValue | null) {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : null;
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: "O sistema ainda não foi conectado ao banco de dados." };
  const parsed = z.object({ email, password: z.string().min(1, "Informe a senha.") })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: { email: String(form.get("email") ?? "") } };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { error: "E-mail ou senha incorretos.", fields: { email: parsed.data.email } };
  }

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", data.user.id).single();
  if (!profile || profile.status === "blocked") {
    await supabase.auth.signOut();
    return { error: "Seu acesso está bloqueado. Fale com a Empiric." };
  }
  await supabase.rpc("log_activity", { p_action: "login", p_entity: "auth" });

  const home = HOME_BY_ROLE[profile.role as Role];
  const next = safeNext(form.get("next"));
  redirect(next && next.startsWith(home) ? next : home);
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: "O sistema ainda não foi conectado ao banco de dados." };
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/auth/confirm?next=/redefinir-senha`,
  });
  // Resposta idêntica exista ou não a conta (evita descobrir e-mails cadastrados).
  return { success: "Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha em instantes." };
}

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "Use ao menos uma letra.").regex(/\d/, "Use ao menos um número."),
    confirm: z.string(),
    consent: z.literal("on", { message: "É preciso aceitar a política de privacidade." }).optional(),
  }).refine((d) => d.password === d.confirm, { message: "As senhas não conferem.", path: ["confirm"] })
    .safeParse({ password: form.get("password"), confirm: form.get("confirm"), consent: form.get("consent") ?? undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Seu link expirou. Solicite um novo em “Esqueci minha senha”." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Não foi possível salvar a nova senha. Tente uma senha diferente." };

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).single();
  if (profile?.status === "invited") {
    if (form.get("consent") !== "on") return { error: "É preciso aceitar a política de privacidade." };
    await supabase.from("profiles").update({ status: "active", lgpd_consent_at: new Date().toISOString() }).eq("id", user.id);
  }
  redirect(HOME_BY_ROLE[(profile?.role as Role) ?? "tenant"]);
}
