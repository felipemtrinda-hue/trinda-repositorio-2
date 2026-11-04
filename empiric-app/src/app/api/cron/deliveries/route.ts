import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/cron";
import { integrations } from "@/lib/integrations/status";

/**
 * Processa a fila de entregas (e-mail / WhatsApp).
 * Etapa 1: sem provedores configurados, marca as entregas como
 * "skipped_not_configured" (registro honesto, sem envio simulado).
 * Etapa 6: plugar Resend e WhatsApp Business Cloud API em src/lib/integrations.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createAdminClient();
  const result: Record<string, number> = {};

  for (const channel of ["email", "whatsapp"] as const) {
    if (integrations[channel]()) {
      result[channel] = 0; // TODO Etapa 6: enviar, registrar provider_ref, reagendar falhas com backoff
      continue;
    }
    const { data } = await db.from("notification_deliveries")
      .update({ status: "skipped_not_configured", last_error: "Integração não configurada" })
      .eq("channel", channel).eq("status", "queued").select("id");
    result[`${channel}_skipped`] = data?.length ?? 0;
  }
  return NextResponse.json(result);
}
