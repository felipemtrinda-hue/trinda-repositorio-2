"use client";
import { useState, useTransition } from "react";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import { generateAccessLink } from "@/lib/actions/people";
import { buttonClass } from "@/components/ui/button";

export function AccessLink({ userId }: { userId: string }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ link?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <button type="button" disabled={pending} onClick={() => start(async () => { setCopied(false); setRes(await generateAccessLink(userId)); })}
        className={buttonClass("secondary", "md", "w-full")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} Gerar link de acesso
      </button>
      {res?.error && <p role="alert" className="mt-2 text-xs text-danger">{res.error}</p>}
      {res?.link && (
        <div className="mt-3 rounded-[16px] bg-mist p-3">
          <p className="mb-2 text-xs text-stone">Link de uso único para criar/redefinir a senha. Envie só para a própria pessoa.</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-xs">{res.link}</code>
            <button type="button" onClick={async () => { await navigator.clipboard.writeText(res.link!); setCopied(true); }}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-paper" aria-label="Copiar link">
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
