"use client";
import { useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { buttonClass } from "./button";

/**
 * Pede confirmação antes de ações importantes (arquivar, bloquear, encerrar).
 * Deve ficar dentro de um <form>; o botão "Confirmar" envia o formulário.
 */
export function ConfirmSubmit({
  children, title, message, confirmLabel = "Confirmar", variant = "danger", formAction, size = "md",
}: {
  children: React.ReactNode; title: string; message: string; confirmLabel?: string;
  variant?: "danger" | "primary" | "secondary"; formAction?: (fd: FormData) => void | Promise<void>; size?: "sm" | "md";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={buttonClass(variant === "danger" ? "secondary" : variant, size, variant === "danger" ? "!text-danger" : "")}>
        {children}
      </button>
      <dialog ref={ref} className="m-auto w-[min(92vw,420px)] rounded-[28px] bg-paper p-0 shadow-[var(--shadow-float)] backdrop:bg-black/30 backdrop:backdrop-blur-[2px] open:animate-[var(--animate-rise)]">
        <div className="p-6">
          <span className={`mb-4 grid size-12 place-items-center rounded-2xl ${variant === "danger" ? "bg-danger-bg text-danger" : "bg-rose-mist text-bordo"}`}>
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <h2 className="heading text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-stone">{message}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => ref.current?.close()} className={buttonClass("secondary", "md")}>Cancelar</button>
            <button type="submit" formAction={formAction} onClick={() => setTimeout(() => ref.current?.close(), 0)} className={buttonClass(variant === "secondary" ? "primary" : variant, "md")}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
