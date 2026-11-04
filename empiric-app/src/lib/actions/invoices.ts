"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DOC_MAX, DOC_TYPES } from "@/lib/documents";
import { dbError, fail, isoDate, parseMoney, reqMoney, type FormState } from "@/lib/validation";

const invoiceSchema = z.object({
  lease_id: z.string().uuid("Selecione o contrato."),
  competence: z.string().regex(/^\d{4}-\d{2}$/, "Informe a competência (mês/ano)."),
  due_date: isoDate("Informe o vencimento."),
  items: z.array(z.object({ label: z.string().trim().min(1, "Descreva cada item."), amount: z.number().refine((n) => !isNaN(n), "Valor de item inválido.") }))
    .min(1, "Inclua ao menos um item."),
  barcode: z.string().trim().max(120).nullable(),
  pix_code: z.string().trim().max(600).nullable(),
  pdf_path: z.string().regex(/^invoice\/\d{4}\/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/).nullable(),
  publish: z.boolean(),
});

/** Cria o boleto com itens e (opcional) o PDF já enviado ao storage. */
export async function createInvoice(input: unknown): Promise<{ error?: string; id?: string }> {
  const me = await requireRole("admin");
  const raw = input as Record<string, unknown>;
  const parsed = invoiceSchema.safeParse({
    ...raw,
    items: Array.isArray(raw?.items) ? raw.items.map((i: { label: string; amount: string }) => ({ label: i.label, amount: parseMoney(i.amount) ?? NaN })) : [],
    barcode: raw?.barcode || null, pix_code: raw?.pix_code || null, pdf_path: raw?.pdf_path || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const amount = Math.round(d.items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  if (amount <= 0) return { error: "O total do boleto precisa ser maior que zero." };

  const supabase = await createClient();
  const { data: lease } = await supabase.from("leases").select("id, property_id, tenant_id").eq("id", d.lease_id).single();
  if (!lease) return { error: "Contrato não encontrado." };

  let document_id: string | null = null;
  if (d.pdf_path) {
    const folder = d.pdf_path.slice(0, d.pdf_path.lastIndexOf("/"));
    const { data: objs } = await supabase.storage.from("documentos").list(folder, { search: d.pdf_path.split("/").pop(), limit: 1 });
    const meta = objs?.[0]?.metadata as { size?: number; mimetype?: string } | undefined;
    if (!meta?.size || !meta.mimetype || !(DOC_TYPES as readonly string[]).includes(meta.mimetype) || meta.size > DOC_MAX) {
      await supabase.storage.from("documentos").remove([d.pdf_path]);
      return { error: "Arquivo do boleto inválido. Envie PDF ou imagem de até 25 MB." };
    }
    // Documento do boleto fica sem published_at próprio: o acesso vem pelo boleto
    const { data: doc, error } = await supabase.from("documents").insert({
      kind: "invoice", title: `Boleto ${d.competence.slice(5)}/${d.competence.slice(0, 4)}`, storage_path: d.pdf_path,
      mime_type: meta.mimetype, size_bytes: meta.size, lease_id: lease.id, property_id: lease.property_id,
      published_at: d.publish ? new Date().toISOString() : null, uploaded_by: me.id,
    }).select("id").single();
    if (error || !doc) return { error: dbError(error) };
    document_id = doc.id;
  }

  const { data: inv, error } = await supabase.from("invoices").insert({
    lease_id: d.lease_id, competence: `${d.competence}-01`, due_date: d.due_date, amount,
    barcode: d.barcode, pix_code: d.pix_code, document_id,
    published_at: d.publish ? new Date().toISOString() : null,
  }).select("id").single();
  if (error || !inv) {
    if (document_id) await supabase.from("documents").delete().eq("id", document_id);
    if (d.pdf_path) await supabase.storage.from("documentos").remove([d.pdf_path]);
    return { error: error?.code === "23505" ? "Já existe um boleto deste contrato para essa competência." : dbError(error) };
  }
  await supabase.from("invoice_items").insert(d.items.map((i, position) => ({ invoice_id: inv.id, label: i.label, amount: i.amount, position })));
  revalidatePath("/admin/financeiro");
  return { id: inv.id };
}

export async function publishInvoice(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase.from("invoices").update({ published_at: now }).eq("id", id).is("published_at", null).select("document_id").single();
  if (data?.document_id) await supabase.from("documents").update({ published_at: now }).eq("id", data.document_id).is("published_at", null);
  revalidatePath(`/admin/financeiro/${id}`);
  redirect(`/admin/financeiro/${id}?ok=boleto_publicado`);
}

export async function cancelInvoice(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  const supabase = await createClient();
  await supabase.from("invoices").update({ status: "cancelled" }).eq("id", id).neq("status", "paid");
  revalidatePath(`/admin/financeiro/${id}`);
  redirect(`/admin/financeiro/${id}?ok=boleto_cancelado`);
}

export async function registerPayment(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireRole("admin");
  const parsed = z.object({
    invoice_id: z.string().uuid(),
    amount: reqMoney("Informe o valor pago."),
    paid_on: isoDate("Informe a data do pagamento."),
    method: z.enum(["boleto", "pix", "transferencia", "dinheiro", "outro"]),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(form, parsed.error.issues[0].message);
  const { invoice_id, amount, paid_on, method } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    invoice_id, amount, method, paid_at: `${paid_on}T12:00:00-03:00`, source: "manual", recorded_by: me.id,
  });
  if (error) return fail(form, dbError(error));
  revalidatePath(`/admin/financeiro/${invoice_id}`);
  redirect(`/admin/financeiro/${invoice_id}?ok=pagamento_registrado`);
}

export async function deletePayment(form: FormData) {
  await requireRole("admin");
  const invoice_id = String(form.get("invoice_id"));
  const supabase = await createClient();
  await supabase.from("payments").delete().eq("id", String(form.get("id"))).eq("source", "manual");
  revalidatePath(`/admin/financeiro/${invoice_id}`);
  redirect(`/admin/financeiro/${invoice_id}?ok=pagamento_estornado`);
}
