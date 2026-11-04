import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Recebe os links de e-mail (convite, recuperação de senha).
 * Templates do Supabase devem apontar para:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/redefinir-senha
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const supabase = await createClient();
  const ok = token_hash && type
    ? !(await supabase.auth.verifyOtp({ type, token_hash })).error
    : code
      ? !(await supabase.auth.exchangeCodeForSession(code)).error
      : false;

  return NextResponse.redirect(new URL(ok ? next : "/login?erro=link", request.url));
}
