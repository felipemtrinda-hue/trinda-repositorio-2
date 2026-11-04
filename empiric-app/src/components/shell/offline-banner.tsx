"use client";
import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
}

export function OfflineBanner() {
  const offline = useSyncExternalStore(subscribe, () => !navigator.onLine, () => false);
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-charcoal px-4 py-2 text-sm text-white animate-[var(--animate-fade)]">
      <WifiOff className="size-4" aria-hidden /> Você está sem conexão. Algumas informações podem estar desatualizadas.
    </div>
  );
}
