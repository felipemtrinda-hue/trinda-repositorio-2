"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft } from "lucide-react";
import { requestPasswordReset, type FormState } from "../actions";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export default function RecoverPage() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  return (
    <>
      <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm text-stone hover:text-charcoal">
        <ArrowLeft className="size-4" /> Voltar ao login
      </Link>
      <h2 className="display mb-2 text-[38px]">Recuperar <em>senha</em></h2>
      <p className="mb-8 text-stone">Enviaremos um link seguro para você criar uma nova senha.</p>
      <form action={action} className="space-y-5" noValidate>
        <FormMessage error={state.error} success={state.success} />
        <Field id="email" label="E-mail" type="email" autoComplete="email" required />
        <SubmitButton pendingLabel="Enviando…">Enviar link</SubmitButton>
      </form>
    </>
  );
}
