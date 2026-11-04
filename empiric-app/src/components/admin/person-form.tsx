"use client";
import { useActionState } from "react";
import { invitePerson, updatePerson } from "@/lib/actions/people";
import type { FormState } from "@/lib/validation";
import { FormMessage } from "@/components/ui/field";
import { FormSection, Grid, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

type Values = Partial<Record<"id" | "full_name" | "email" | "phone" | "whatsapp" | "document_id" | "notes", string>>;

export function PersonForm({ role, initial }: { role: "owner" | "tenant"; initial?: Values }) {
  const editing = Boolean(initial?.id);
  const [state, action] = useActionState<FormState, FormData>(editing ? updatePerson : invitePerson, {});
  const v = { ...initial, ...state.values };
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="role" value={role} />
      {editing && <input type="hidden" name="id" value={v.id} />}
      <FormMessage error={state.error} />
      <FormSection title="Dados pessoais" description={editing ? undefined : "Enviaremos um convite para este e-mail. A pessoa cria a própria senha no primeiro acesso."}>
        <Grid>
          <Input id="full_name" label="Nome completo" required defaultValue={v.full_name} autoComplete="off" className="md:col-span-2" />
          <Input id="email" label="E-mail" type="email" required={!editing} disabled={editing} defaultValue={v.email}
            hint={editing ? "O e-mail de acesso não pode ser alterado por aqui." : undefined} />
          <Input id="document_id" label="CPF ou CNPJ" inputMode="numeric" defaultValue={v.document_id} />
          <Input id="phone" label="Telefone" type="tel" inputMode="tel" defaultValue={v.phone} placeholder="(42) 3222-0000" />
          <Input id="whatsapp" label="WhatsApp" type="tel" inputMode="tel" defaultValue={v.whatsapp} placeholder="(42) 99999-0000" />
        </Grid>
        <Textarea id="notes" label="Observações internas" defaultValue={v.notes} className="mt-4" rows={3} />
      </FormSection>
      <div className="flex justify-end">
        <div className="w-full sm:w-60"><SubmitButton pendingLabel={editing ? "Salvando…" : "Enviando convite…"}>{editing ? "Salvar alterações" : "Cadastrar e convidar"}</SubmitButton></div>
      </div>
    </form>
  );
}
