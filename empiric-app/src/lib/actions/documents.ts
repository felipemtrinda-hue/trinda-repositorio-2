"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DOC_MAX, DOC_TYPES } from "@/lib/documents";
import { dbError } from "@/lib/validation";

const uuidOrNull = z.preprocess((v) => v || null, z.string().uuid().nullable());

const docSchema = z.object({
  kind: z.enum(["contract", "inspection", "invoice", "receipt", "statement", "income_tax", "personal", "other"]),
  title: z.string().trim().min(1, "Informe o título.").max(200),
  path: z.string().regex(/^[a-z_]+\/\d{4}\/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/, "Arquivo inválido."),
  property_id: uuidOrNull, lease_id: uuidOrNull, recipient_id: uuidOrNull,
  base_year: z.preprocess((v) => (v ? Number(v) : null), z.number().int().min(2000).max(2100).nullable()),
  competence: z.preprocess((v) => (v ? `${String(v).slice(0, 7)}-01` : null), z.string().nullable()),
  publish: z.boolean(),
}).refine((d) => d.kind !== "income_tax" || d.base_year, { message: "Informe o ano-base do Imposto de Renda." })
  .refine((d) => d.recipient_id || d.property_id || d.lease_id, { message: "Escolha para quem é o documento (imóvel, contrato ou pessoa)." });

/** Registra no banco um arquivo já enviado ao storage, conferindo tipo e tamanho reais. */
export async function registerDocument(input: unknown): Promise<{ error?: string }> {
  const me = await requireRole("admin");
  const parsed = docSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const supabase = await createClient();

  const folder = d.path.slice(0, d.path.lastIndexOf("/"));
  const name = d.path.slice(d.path.lastIndexOf("/") + 1);
  const { data: objs } = await supabase.storage.from("documentos").list(folder, { search: name, limit: 1 });
  const meta = objs?.[0]?.metadata as { size?: number; mimetype?: string } | undefined;
  if (!meta?.size || !meta.mimetype || !(DOC_TYPES as readonly string[]).includes(meta.mimetype) || meta.size > DOC_MAX) {
    await supabase.storage.from("documentos").remove([d.path]);
    return { error: "O arquivo enviado não é válido (tipo ou tamanho). Envie PDF ou imagem de até 25 MB." };
  }

  const { error } = await supabase.from("documents").insert({
    kind: d.kind, title: d.title, storage_path: d.path, mime_type: meta.mimetype, size_bytes: meta.size,
    property_id: d.property_id, lease_id: d.lease_id, recipient_id: d.recipient_id,
    base_year: d.base_year, competence: d.competence,
    published_at: d.publish ? new Date().toISOString() : null, uploaded_by: me.id,
  });
  if (error) {
    await supabase.storage.from("documentos").remove([d.path]);
    return { error: dbError(error) };
  }
  revalidatePath("/admin/documentos");
  return {};
}

export async function setDocumentPublished(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  const publish = form.get("publish") === "1";
  const supabase = await createClient();
  await supabase.from("documents").update({ published_at: publish ? new Date().toISOString() : null }).eq("id", id);
  revalidatePath("/admin/documentos");
  redirect(`/admin/documentos?${String(form.get("back") ?? "")}&ok=${publish ? "doc_publicado" : "doc_oculto"}`);
}

export async function deleteDocument(form: FormData) {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("documents").delete().eq("id", String(form.get("id"))).select("storage_path").single();
  if (data) await supabase.storage.from("documentos").remove([data.storage_path]);
  revalidatePath("/admin/documentos");
  redirect(`/admin/documentos?ok=doc_removido`);
}
