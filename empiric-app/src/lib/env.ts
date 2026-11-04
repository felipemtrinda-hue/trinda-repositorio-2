export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** O app abre uma tela de configuração pendente em vez de quebrar. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
