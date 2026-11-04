"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, isoDate, optText, reqMoney, type FormState } from "@/lib/validation";

const leaseSchema = z.object({
  property_id: z.string().uuid("Selecione o imóvel."),
  tenant_id: z.string().uuid("Selecione o inquilino."),
  status: z.enum(["draft", "awaiting_signature", "active", "ended", "cancelled"]),
  start_date: isoDate("Informe a data de início."),
  end_date: isoDate("Informe a data de término."),
  due_day: z.preprocess(Number, z.number().int().min(1, "Dia de vencimento entre 1 e 31.").max(31, "Dia de vencimento entre 1 e 31.")),
  rent_amount: reqMoney("Informe o valor do aluguel."),
  adjustment_index: optText,
  renewal_alert_days: z.preprocess((v) => (v === "" ? 60 : Number(v)), z.number().int().min(0).max(365)),
  notes: optText,
}).refine((d) => d.end_date > d.start_date, { message: "O término deve ser depois do início." });

export async function saveLease(_: FormState, form: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = leaseSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(form, parsed.error.issues[0].message);
  const id = form.get("id");
  const supabase = await createClient();
  const { data, error } = typeof id === "string" && id
    ? await supabase.from("leases").update(parsed.data).eq("id", id).select("id").single()
    : await supabase.from("leases").insert(parsed.data).select("id").single();
  if (error || !data) return fail(form, dbError(error));
  revalidatePath("/admin/contratos");
  redirect(`/admin/contratos/${data.id}?ok=contrato_salvo`);
}

export async function setLeaseStatus(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  const status = z.enum(["awaiting_signature", "active", "ended", "cancelled"]).parse(form.get("status"));
  const supabase = await createClient();
  const { error } = await supabase.from("leases").update({ status }).eq("id", id);
  if (error) redirect(`/admin/contratos/${id}?erro=${encodeURIComponent(dbError(error))}`);
  revalidatePath(`/admin/contratos/${id}`);
  redirect(`/admin/contratos/${id}?ok=status_contrato`);
}
