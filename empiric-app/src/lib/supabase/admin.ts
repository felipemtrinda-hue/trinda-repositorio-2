import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/env";

/**
 * Cliente com a chave secreta — ignora RLS. Use SOMENTE em código de servidor,
 * depois de checar que quem pediu é admin (ex.: criar usuário, URL assinada).
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY não configurada no servidor.");
  return createClient(supabaseUrl, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
