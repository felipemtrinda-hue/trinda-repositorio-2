"use client";
import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLElement>(null);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { const r = document.createRange(); if (ref.current) { r.selectNodeContents(ref.current); getSelection()?.removeAllRanges(); getSelection()?.addRange(r); } }
  }
  return (
    <div className="rounded-[16px] bg-mist p-3">
      <p className="mb-1.5 text-xs font-medium text-stone">{label}</p>
      <div className="flex items-center gap-2">
        <code ref={ref} className="min-w-0 flex-1 break-all text-[13px] leading-snug">{value}</code>
        <button type="button" onClick={copy} className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${copied ? "bg-success-bg text-success" : "bg-bordo text-white shadow-[var(--shadow-brand)]"}`}>
          {copied ? <><Check className="size-4" /> Copiado</> : <><Copy className="size-4" /> Copiar</>}
        </button>
      </div>
    </div>
  );
}
