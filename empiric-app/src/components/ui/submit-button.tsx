"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { buttonClass } from "./button";

export function SubmitButton({ children, pendingLabel = "Salvando…", full = true }: { children: React.ReactNode; pendingLabel?: string; full?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass("primary", "lg", full ? "w-full" : "")} aria-busy={pending}>
      {pending ? (<><Loader2 className="size-4 animate-spin" aria-hidden /> {pendingLabel}</>) : children}
    </button>
  );
}
