"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { buttonClass } from "./button";

export function SubmitButton({ children, pendingLabel = "Aguarde…" }: { children: React.ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "w-full")} aria-busy={pending}>
      {pending ? (<><Loader2 className="size-4 animate-spin" aria-hidden /> {pendingLabel}</>) : children}
    </button>
  );
}
