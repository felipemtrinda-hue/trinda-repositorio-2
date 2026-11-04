"use client";
import { useRef, useState } from "react";
import { Download, Eye, Loader2, X } from "lucide-react";

/** Visualizar no app (PDF/imagem) e baixar — sempre via link temporário do servidor. */
export function DocActions({ id, compact = false }: { id: string; compact?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<{ url?: string; mime?: string; title?: string; error?: string; loading?: boolean }>({});

  async function open() {
    setState({ loading: true });
    ref.current?.showModal();
    try {
      const res = await fetch(`/api/documentos/${id}?json=1`, { cache: "no-store" });
      const data = await res.json();
      setState(res.ok ? data : { error: data.error ?? "Não foi possível abrir." });
    } catch { setState({ error: "Sem conexão. Tente novamente." }); }
  }

  const btn = "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition";
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <button type="button" onClick={open} className={`${btn} bg-mist text-charcoal hover:bg-[#ebebef]`} aria-label="Visualizar">
        <Eye className="size-4" aria-hidden />{!compact && <span className="hidden sm:inline">Ver</span>}
      </button>
      <a href={`/api/documentos/${id}?download=1`} className={`${btn} bg-rose-mist text-bordo hover:bg-rose-line`} aria-label="Baixar">
        <Download className="size-4" aria-hidden />{!compact && <span className="hidden sm:inline">Baixar</span>}
      </a>
      <dialog ref={ref} onClose={() => setState({})}
        className="m-auto h-[min(88dvh,900px)] w-[min(96vw,960px)] overflow-hidden rounded-[28px] bg-paper p-0 shadow-[var(--shadow-float)] backdrop:bg-black/40 backdrop:backdrop-blur-[2px]">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-cream px-5 py-3">
            <p className="heading truncate font-bold">{state.title ?? "Documento"}</p>
            <span className="flex items-center gap-2">
              <a href={`/api/documentos/${id}?download=1`} className={`${btn} bg-rose-mist text-bordo`}><Download className="size-4" /> Baixar</a>
              <button type="button" onClick={() => ref.current?.close()} className="grid size-9 place-items-center rounded-full bg-mist" aria-label="Fechar"><X className="size-4" /></button>
            </span>
          </div>
          <div className="grid flex-1 place-items-center bg-mist">
            {state.loading && <Loader2 className="size-6 animate-spin text-stone" aria-label="Carregando" />}
            {state.error && <p className="px-6 text-center text-sm text-danger">{state.error}</p>}
            {state.url && (state.mime === "application/pdf"
              ? <iframe src={state.url} title={state.title} className="h-full w-full bg-paper" />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={state.url} alt={state.title ?? "Documento"} className="max-h-full max-w-full object-contain" />)}
          </div>
        </div>
      </dialog>
    </span>
  );
}
