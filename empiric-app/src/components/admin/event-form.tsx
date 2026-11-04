"use client";
import { useActionState } from "react";
import { createEvent } from "@/lib/actions/calendar";
import type { FormState } from "@/lib/validation";
import { FormMessage } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

const KINDS = [
  { value: "task", label: "Tarefa" }, { value: "inspection", label: "Vistoria" }, { value: "maintenance", label: "Manutenção" },
  { value: "payout", label: "Repasse" }, { value: "reminder", label: "Lembrete" },
];
const VIS = [
  { value: "none", label: "Só equipe Empiric" }, { value: "owner", label: "Proprietário" },
  { value: "tenant", label: "Inquilino" }, { value: "both", label: "Proprietário e inquilino" },
];

export function EventForm({ day, properties }: { day: string; properties: { value: string; label: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(createEvent, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-3" noValidate>
      <FormMessage error={state.error} />
      <Input id="title" label="Título" required defaultValue={v.title} placeholder="Vistoria de saída" />
      <div className="grid grid-cols-2 gap-3">
        <Input id="day" label="Data" type="date" required defaultValue={v.day ?? day} />
        <Input id="time" label="Hora" type="time" defaultValue={v.time} hint="Vazio = dia inteiro" />
      </div>
      <Select id="kind" label="Tipo" options={KINDS} defaultValue={v.kind ?? "task"} />
      <Select id="property_id" label="Imóvel" options={properties} placeholder="Nenhum" defaultValue={v.property_id} />
      <Select id="visible" label="Visível para" options={VIS} defaultValue={v.visible ?? "none"} />
      <Textarea id="description" label="Detalhes" rows={2} defaultValue={v.description} />
      <SubmitButton pendingLabel="Adicionando…">Adicionar à agenda</SubmitButton>
    </form>
  );
}
