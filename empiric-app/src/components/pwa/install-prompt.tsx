"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Share, SquarePlus, X } from "lucide-react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const KEY = "empiric:install-dismissed";

const noop = () => () => {};
function useEnv() {
  return useSyncExternalStore(noop, () => {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    let dismissed = false;
    try { dismissed = Number(localStorage.getItem(KEY) ?? 0) > Date.now(); } catch {}
    return `${ios ? 1 : 0}${standalone ? 1 : 0}${mobile ? 1 : 0}${dismissed ? 1 : 0}`;
  }, () => "0000");
}

/**
 * Convite para instalar o app na tela inicial.
 * Android/Chrome: botão nativo (beforeinstallprompt). iPhone: instruções do Safari.
 * Some quando já instalado ou por 30 dias após "Agora não".
 */
export function InstallPrompt() {
  const env = useEnv();
  const [ios, standalone, mobile, dismissedStored] = env.split("").map((c) => c === "1");
  const [deferred, setDeferred] = useState<BIP | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BIP); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(KEY, String(Date.now() + 30 * 864e5)); } catch {}
    setClosed(true);
  };

  if (closed || dismissedStored || standalone || !mobile || (!ios && !deferred)) return null;

  return (
    <section aria-label="Instalar aplicativo" className="mb-5 flex items-start gap-4 rounded-[24px] bg-paper p-4 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] animate-[var(--animate-rise)]">
      <Image src="/icons/icon-192.png" alt="" width={52} height={52} className="rounded-[14px] shadow-[var(--shadow-brand)]" />
      <div className="min-w-0 flex-1">
        <p className="heading font-bold">Instale o app Empiric</p>
        {ios ? (
          <p className="mt-1 text-sm text-stone">
            Toque em <Share className="inline size-4 -translate-y-0.5 text-info" aria-label="Compartilhar" /> e depois em{" "}
            <span className="whitespace-nowrap font-medium text-charcoal"><SquarePlus className="inline size-4 -translate-y-0.5" aria-hidden /> Adicionar à Tela de Início</span>.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-stone">Acesse boletos e chamados direto da tela inicial, em tela cheia.</p>
            <button onClick={async () => { await deferred!.prompt(); const r = await deferred!.userChoice; if (r.outcome === "accepted") setClosed(true); setDeferred(null); }}
              className="mt-3 h-10 rounded-full bg-bordo px-5 text-sm font-semibold text-white shadow-[var(--shadow-brand)]">
              Instalar
            </button>
          </>
        )}
      </div>
      <button onClick={dismiss} className="grid size-8 shrink-0 place-items-center rounded-full bg-mist text-stone" aria-label="Agora não"><X className="size-4" /></button>
    </section>
  );
}
