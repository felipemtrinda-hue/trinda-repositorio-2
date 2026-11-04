"use client";
import { useActionState } from "react";
import { updatePassword, type FormState } from "../actions";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function NewPasswordForm({ firstAccess }: { firstAccess: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage error={state.error} />
      <Field id="password" label="Nova senha" type="password" autoComplete="new-password" required hint="Mínimo de 8 caracteres, com letras e números." />
      <Field id="confirm" label="Confirme a senha" type="password" autoComplete="new-password" required />
      {firstAccess && (
        <label className="flex items-start gap-3 rounded-2xl border border-cream bg-paper p-4 text-sm text-graphite">
          <input type="checkbox" name="consent" className="mt-1 size-4 accent-[var(--color-bordo)]" required />
          <span>Li e concordo com a política de privacidade e o tratamento dos meus dados pela Empiric conforme a LGPD.</span>
        </label>
      )}
      <SubmitButton pendingLabel="Salvando…">{firstAccess ? "Ativar minha conta" : "Salvar nova senha"}</SubmitButton>
    </form>
  );
}
