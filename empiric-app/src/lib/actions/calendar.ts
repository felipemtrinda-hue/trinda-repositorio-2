"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, isoDate, optText, reqText, type FormState } from "@/lib/validation";

export async function createEvent(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireRole("admin");
  const parsed = z.object({
    title: reqText("Informe o título."),
    kind: z.enum(["inspection", "maintenance", "payout", "task", "reminder"]),
    day: isoDate("Informe a data."),
    time: z.string().regex(/^(\d{2}:\d{2})?$/).optional(),
    description: optText,
    property_id: z.preprocess((v) => v || null, z.string().uuid().nullable()),
    visible: z.enum(["none", "owner", "tenant", "both"]).default("none"),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(form, parsed.error.issues[0].message);
  const d = parsed.data;
  if (d.visible !== "none" && !d.property_id) return fail(form, "Para mostrar ao proprietário/inquilino, selecione o imóvel.");

  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").insert({
    title: d.title, kind: d.kind, description: d.description, property_id: d.property_id,
    starts_at: `${d.day}T${d.time || "09:00"}:00-03:00`, all_day: !d.time,
    visible_to_owner: d.visible === "owner" || d.visible === "both",
    visible_to_tenant: d.visible === "tenant" || d.visible === "both",
    created_by: me.id, assignee_id: me.id,
  });
  if (error) return fail(form, dbError(error));
  revalidatePath("/admin/agenda");
  redirect(`/admin/agenda?data=${d.day}&ok=evento_salvo`);
}

export async function deleteEvent(form: FormData) {
  await requireRole("admin");
  const supabase = await createClient();
  // Eventos automáticos (de contratos) não têm created_by e são regenerados pelo banco
  await supabase.from("calendar_events").delete().eq("id", String(form.get("id"))).not("created_by", "is", null);
  revalidatePath("/admin/agenda");
  redirect(`/admin/agenda?${String(form.get("back") ?? "")}&ok=evento_removido`);
}
