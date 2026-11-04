"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, optDecimal, optInt, optMoney, optText, reqText, type FormState } from "@/lib/validation";

const propertySchema = z.object({
  title: reqText("Informe um título para o imóvel."),
  code: optText,
  kind: z.enum(["apartment", "house", "commercial", "land", "other"]),
  status: z.enum(["available", "rented", "reserved", "maintenance"]),
  description: optText,
  zip_code: z.preprocess((v) => (typeof v === "string" ? v.replace(/\D/g, "") || null : null), z.string().length(8, "CEP inválido.").nullable()),
  street: reqText("Informe a rua."),
  number: optText,
  complement: optText,
  district: optText,
  city: reqText("Informe a cidade."),
  state: z.string().trim().toUpperCase().length(2, "UF com 2 letras."),
  bedrooms: optInt, bathrooms: optInt, parking_spots: optInt,
  area_m2: optDecimal,
  rent_amount: optMoney, condo_amount: optMoney, iptu_amount: optMoney,
  features: z.preprocess((v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : []), z.array(z.string().max(60)).max(40)),
});

export async function saveProperty(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireRole("admin");
  const parsed = propertySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(form, parsed.error.issues[0].message);

  const id = form.get("id");
  const supabase = await createClient();
  const { data, error } = typeof id === "string" && id
    ? await supabase.from("properties").update(parsed.data).eq("id", id).select("id").single()
    : await supabase.from("properties").insert({ ...parsed.data, created_by: me.id }).select("id").single();
  if (error || !data) return fail(form, dbError(error));

  revalidatePath("/admin/imoveis");
  redirect(`/admin/imoveis/${data.id}?ok=imovel_salvo`);
}

export async function archiveProperty(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  const supabase = await createClient();
  await supabase.from("properties").update({ status: "archived" }).eq("id", id);
  revalidatePath("/admin/imoveis");
  redirect("/admin/imoveis?ok=imovel_arquivado");
}

export async function linkOwner(_: FormState, form: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = z.object({
    property_id: z.string().uuid(),
    owner_id: z.string().uuid("Selecione o proprietário."),
    share_pct: z.preprocess((v) => Number(String(v).replace(",", ".")), z.number().gt(0, "Participação inválida.").max(100, "Máximo 100%.")),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(form, parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = await supabase.from("property_owners").upsert(parsed.data);
  if (error) return fail(form, dbError(error));
  revalidatePath(`/admin/imoveis/${parsed.data.property_id}`);
  redirect(`/admin/imoveis/${parsed.data.property_id}?ok=vinculo_salvo`);
}

export async function unlinkOwner(form: FormData) {
  await requireRole("admin");
  const property_id = String(form.get("property_id"));
  const supabase = await createClient();
  await supabase.from("property_owners").delete().eq("property_id", property_id).eq("owner_id", String(form.get("owner_id")));
  revalidatePath(`/admin/imoveis/${property_id}`);
  redirect(`/admin/imoveis/${property_id}?ok=vinculo_removido`);
}

/** Registra fotos já enviadas pelo navegador ao bucket privado "imoveis". */
export async function registerPhotos(propertyId: string, paths: string[]) {
  await requireRole("admin");
  const ok = z.string().uuid().safeParse(propertyId).success &&
    paths.length > 0 && paths.length <= 30 && paths.every((p) => p.startsWith(`${propertyId}/`) && !p.includes(".."));
  if (!ok) return { error: "Envio inválido." };

  const supabase = await createClient();
  const { count } = await supabase.from("property_photos").select("id", { count: "exact", head: true }).eq("property_id", propertyId);
  const { error } = await supabase.from("property_photos").insert(
    paths.map((storage_path, i) => ({ property_id: propertyId, storage_path, position: (count ?? 0) + i })),
  );
  if (error) return { error: dbError(error) };
  revalidatePath(`/admin/imoveis/${propertyId}`);
  return { ok: true };
}

export async function deletePhoto(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  const property_id = String(form.get("property_id"));
  const supabase = await createClient();
  const { data } = await supabase.from("property_photos").delete().eq("id", id).select("storage_path").single();
  if (data) await supabase.storage.from("imoveis").remove([data.storage_path]);
  revalidatePath(`/admin/imoveis/${property_id}`);
  redirect(`/admin/imoveis/${property_id}?ok=foto_removida`);
}
