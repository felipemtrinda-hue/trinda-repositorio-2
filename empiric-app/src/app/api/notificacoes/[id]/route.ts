import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { HOME_BY_ROLE, getProfile } from "@/lib/auth";

/** Abre uma notificação: marca como lida (RLS: só as próprias) e leva ao destino. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) return NextResponse.redirect(new URL("/login", request.url));
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("id", id).select("link").maybeSingle();
  const home = HOME_BY_ROLE[profile.role];
  const link = data?.link;
  // Só caminhos internos da área do próprio perfil (evita redirecionamento aberto)
  const target = link && link.startsWith(home) && !link.startsWith("//") ? link : `${home}/notificacoes`;
  return NextResponse.redirect(new URL(target, request.url), { status: 303 });
}
