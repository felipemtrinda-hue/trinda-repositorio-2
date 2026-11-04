import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Entrega um documento por URL assinada de curta duração (2 min).
 * A consulta usa a sessão do usuário: se a RLS não permitir, o documento
 * simplesmente "não existe" para ele. Cada acesso fica no histórico.
 *   ?download=1  → força download    ?json=1 → devolve { url, mime, title }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });

  const { data: doc } = await supabase.from("documents").select("id, title, storage_path, mime_type").eq("id", id).maybeSingle();
  if (!doc) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });

  const download = request.nextUrl.searchParams.get("download") === "1";
  const ext = doc.storage_path.split(".").pop();
  const filename = `${doc.title.replace(/[^\p{L}\p{N} _.-]/gu, "").trim() || "documento"}.${ext}`;
  const { data: signed, error } = await supabase.storage.from("documentos")
    .createSignedUrl(doc.storage_path, 120, download ? { download: filename } : undefined);
  if (error || !signed) return NextResponse.json({ error: "Arquivo indisponível." }, { status: 404 });

  await supabase.rpc("log_activity", { p_action: download ? "download" : "view", p_entity: "documents", p_entity_id: id });

  if (request.nextUrl.searchParams.get("json") === "1") {
    return NextResponse.json({ url: signed.signedUrl, mime: doc.mime_type, title: doc.title },
      { headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.redirect(signed.signedUrl, { headers: { "Cache-Control": "no-store" } });
}
