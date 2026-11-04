"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/env";
import { dbError, fail, optDocument, optPhone, optText, reqText, type FormState } from "@/lib/validation";

const LIST = { owner: "/admin/proprietarios", tenant: "/admin/inquilinos" } as const;

const personSchema = z.object({
  full_name: reqText("Informe o nome completo."),
  phone: optPhone,
  whatsapp: optPhone,
  document_id: optDocument,
  notes: optText,
});

/**
 * Convida proprietário ou inquilino. O usuário recebe o e-mail de convite,
 * cria a senha em /redefinir-senha e aceita a política de privacidade.
 * O papel vai em app_metadata (só o servidor altera) → trigger sincroniza o perfil.
 */
export async function invitePerson(_: FormState, form: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = personSchema.extend({
    role: z.enum(["owner", "tenant"]),
    email: z.string().trim().toLowerCase().email("E-mail inválido."),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(form, parsed.error.issues[0].message);
  const { role, email, ...profile } = parsed.data;

  let admin;
  try { admin = createAdminClient(); } catch { return fail(form, "SUPABASE_SECRET_KEY não configurada no servidor."); }

  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/redefinir-senha`,
  });
  if (error || !invited.user) {
    const msg = error?.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered")) return fail(form, "Já existe uma conta com este e-mail.");
    if (msg.includes("rate")) return fail(form, "Limite de e-mails do Supabase atingido. Configure um SMTP próprio (README) ou aguarde.");
    return fail(form, "Não foi possível enviar o convite. Verifique o e-mail e tente novamente.");
  }

  const uid = invited.user.id;
  const { error: metaErr } = await admin.auth.admin.updateUserById(uid, { app_metadata: { role, full_name: profile.full_name } });
  if (metaErr) {
    await admin.auth.admin.deleteUser(uid); // não deixa conta "órfã" com papel padrão
    return fail(form, "Não foi possível concluir o cadastro. Tente novamente.");
  }
  await admin.from("profiles").update(profile).eq("id", uid);

  revalidatePath(LIST[role]);
  redirect(`/admin/pessoas/${uid}?ok=pessoa_convidada`);
}

export async function updatePerson(_: FormState, form: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = String(form.get("id"));
  const parsed = personSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(form, parsed.error.issues[0].message);
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", id);
  if (error) return fail(form, dbError(error));
  revalidatePath(`/admin/pessoas/${id}`);
  redirect(`/admin/pessoas/${id}?ok=pessoa_salva`);
}

/** Bloqueia/desbloqueia no perfil (RLS) e no Auth (impede novo login). */
export async function setBlocked(form: FormData) {
  const me = await requireRole("admin");
  const id = String(form.get("id"));
  const block = form.get("block") === "1";
  if (id === me.id) redirect(`/admin/pessoas/${id}`);
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(id, { ban_duration: block ? "876000h" : "none" });
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("lgpd_consent_at").eq("id", id).single();
  await supabase.from("profiles").update({ status: block ? "blocked" : data?.lgpd_consent_at ? "active" : "invited" }).eq("id", id);
  revalidatePath(`/admin/pessoas/${id}`);
  redirect(`/admin/pessoas/${id}?ok=${block ? "pessoa_bloqueada" : "pessoa_desbloqueada"}`);
}

/**
 * Gera um link de acesso de uso único (criar/redefinir senha) para o admin
 * enviar por WhatsApp quando o e-mail não chegar. Não envia nada sozinho.
 */
export async function generateAccessLink(id: string): Promise<{ link?: string; error?: string }> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("email, status").eq("id", id).single();
  if (!p) return { error: "Usuário não encontrado." };
  if (p.status === "blocked") return { error: "Desbloqueie o acesso antes de gerar um link." };
  const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "recovery", email: p.email });
  if (error || !data.properties?.hashed_token) return { error: "Não foi possível gerar o link." };
  await supabase.rpc("log_activity", { p_action: "send", p_entity: "auth", p_entity_id: id, p_details: { kind: "access_link" } });
  return { link: `${siteUrl}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery&next=/redefinir-senha` };
}
