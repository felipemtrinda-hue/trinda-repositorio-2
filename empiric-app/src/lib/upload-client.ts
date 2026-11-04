"use client";
import { createClient } from "@/lib/supabase/client";
import { validateFile, type UploadResult } from "@/lib/documents";

/** Envia um arquivo ao bucket privado "documentos" (a RLS só permite admin). */
export async function uploadDocument(file: File, folder: string): Promise<UploadResult> {
  const err = validateFile(file);
  if (err) return { error: err };
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${folder}/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await createClient().storage.from("documentos").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: `Falha ao enviar "${file.name}". Verifique a conexão e tente de novo.` };
  return { path, mime: file.type, size: file.size };
}
