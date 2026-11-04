"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerPhotos } from "@/lib/actions/properties";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX = 10 * 1024 * 1024;

/** Envia as fotos direto ao storage privado (a RLS permite só admin) e registra no banco. */
export function PhotoUploader({ propertyId }: { propertyId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    const bad = list.find((f) => !TYPES.includes(f.type) || f.size > MAX);
    if (bad) { setError(`"${bad.name}": use JPG, PNG ou WebP de até 10 MB.`); return; }
    setError(null);
    setBusy({ done: 0, total: list.length });
    const supabase = createClient();
    const paths: string[] = [];
    for (const f of list) {
      const ext = f.type.split("/")[1].replace("jpeg", "jpg");
      const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("imoveis").upload(path, f, { contentType: f.type, upsert: false });
      if (upErr) { setError(`Falha ao enviar "${f.name}". Tente novamente.`); break; }
      paths.push(path);
      setBusy((b) => b && { ...b, done: b.done + 1 });
    }
    if (paths.length) {
      const res = await registerPhotos(propertyId, paths);
      if (res?.error) setError(res.error);
      else router.replace(`/admin/imoveis/${propertyId}?ok=fotos_salvas`, { scroll: false });
    }
    setBusy(null);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <button type="button" onClick={() => input.current?.click()} disabled={!!busy}
        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-smoke bg-mist text-sm text-stone transition hover:border-bordo/50 hover:text-bordo disabled:opacity-70">
        {busy
          ? <><Loader2 className="size-6 animate-spin" aria-hidden /> Enviando {busy.done}/{busy.total}…</>
          : <><ImagePlus className="size-6" aria-hidden /> Adicionar fotos</>}
      </button>
      <input ref={input} type="file" accept={TYPES.join(",")} multiple hidden onChange={(e) => onFiles(e.target.files)} />
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
