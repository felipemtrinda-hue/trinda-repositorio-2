"use client";
import { useActionState } from "react";
import { registerPayment } from "@/lib/actions/invoices";
import type { FormState } from "@/lib/validation";
import { FormMessage } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { moneyInput } from "@/lib/format";

export function PaymentForm({ invoiceId, remaining, today }: { invoiceId: string; remaining: number; today: string }) {
  const [state, action] = useActionState<FormState, FormData>(registerPayment, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <FormMessage error={state.error} />
      <div className="grid grid-cols-2 gap-3">
        <Input id="amount" label="Valor pago" inputMode="decimal" required defaultValue={v.amount ?? moneyInput(remaining)} />
        <Input id="paid_on" label="Data" type="date" required defaultValue={v.paid_on ?? today} />
      </div>
      <Select id="method" label="Forma" defaultValue={v.method ?? "pix"} options={[
        { value: "pix", label: "Pix" }, { value: "boleto", label: "Boleto" }, { value: "transferencia", label: "Transferência" },
        { value: "dinheiro", label: "Dinheiro" }, { value: "outro", label: "Outro" },
      ]} />
      <SubmitButton pendingLabel="Registrando…">Registrar pagamento</SubmitButton>
    </form>
  );
}
