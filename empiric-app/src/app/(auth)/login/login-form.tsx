"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signIn, type FormState } from "../actions";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormMessage error={state.error ?? notice} />
      <Field id="email" label="E-mail" type="email" autoComplete="email" required defaultValue={state.fields?.email} placeholder="voce@email.com" />
      <div className="relative">
        <Field id="password" label="Senha" type={show ? "text" : "password"} autoComplete="current-password" required />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-[34px] grid size-9 place-items-center rounded-full text-stone hover:text-charcoal" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <div className="flex justify-end">
        <Link href="/recuperar-senha" className="text-sm font-medium text-bordo hover:underline">Esqueci minha senha</Link>
      </div>
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
