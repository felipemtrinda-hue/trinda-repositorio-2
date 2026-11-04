"use client";
import { useActionState } from "react";
import { saveLease } from "@/lib/actions/leases";
import type { FormState } from "@/lib/validation";
import { FormMessage } from "@/components/ui/field";
import { FormSection, Grid, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

type Opt = { value: string; label: string };
type Values = Partial<Record<"id" | "property_id" | "tenant_id" | "status" | "start_date" | "end_date" | "due_day" | "rent_amount" | "adjustment_index" | "renewal_alert_days" | "notes", string>>;

const STATUS: Opt[] = [
  { value: "draft", label: "Rascunho" }, { value: "awaiting_signature", label: "Aguardando assinatura" },
  { value: "active", label: "Ativo" }, { value: "ended", label: "Encerrado" }, { value: "cancelled", label: "Cancelado" },
];

export function LeaseForm({ properties, tenants, initial = {} }: { properties: Opt[]; tenants: Opt[]; initial?: Values }) {
  const [state, action] = useActionState<FormState, FormData>(saveLease, {});
  const v = { ...initial, ...state.values };
  return (
    <form action={action} className="space-y-4" noValidate>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <FormMessage error={state.error} />
      <FormSection title="Partes" description="Ao ativar o contrato, o imóvel passa para “Alugado” e as datas entram na agenda.">
        <Grid>
          <Select id="property_id" label="Imóvel" options={properties} placeholder="Selecione…" required defaultValue={v.property_id} />
          <Select id="tenant_id" label="Inquilino" options={tenants} placeholder="Selecione…" required defaultValue={v.tenant_id} />
          <Select id="status" label="Situação" options={STATUS} defaultValue={v.status ?? "draft"} />
          <Input id="adjustment_index" label="Índice de reajuste" defaultValue={v.adjustment_index} placeholder="IGP-M, IPCA…" />
        </Grid>
      </FormSection>
      <FormSection title="Vigência e valores">
        <Grid cols={3}>
          <Input id="start_date" label="Início" type="date" required defaultValue={v.start_date} />
          <Input id="end_date" label="Término" type="date" required defaultValue={v.end_date} />
          <Input id="due_day" label="Dia de vencimento" type="number" min={1} max={31} required defaultValue={v.due_day ?? "10"} />
          <Input id="rent_amount" label="Aluguel (R$)" inputMode="decimal" required defaultValue={v.rent_amount} placeholder="1.850,00" />
          <Input id="renewal_alert_days" label="Alerta de renovação (dias antes)" type="number" min={0} max={365} defaultValue={v.renewal_alert_days ?? "60"} />
        </Grid>
        <Textarea id="notes" label="Observações" defaultValue={v.notes} className="mt-4" rows={3} />
      </FormSection>
      <div className="flex justify-end"><div className="w-full sm:w-60"><SubmitButton>{v.id ? "Salvar alterações" : "Cadastrar contrato"}</SubmitButton></div></div>
    </form>
  );
}
