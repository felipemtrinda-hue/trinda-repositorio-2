"use client";
import { useActionState } from "react";
import { linkOwner } from "@/lib/actions/properties";
import type { FormState } from "@/lib/validation";
import { FormMessage } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function LinkOwnerForm({ propertyId, owners, remaining }: { propertyId: string; owners: { value: string; label: string }[]; remaining: number }) {
  const [state, action] = useActionState<FormState, FormData>(linkOwner, {});
  if (!owners.length) return <p className="text-sm text-stone">Cadastre um proprietário primeiro em Proprietários → Novo.</p>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="property_id" value={propertyId} />
      <FormMessage error={state.error} />
      <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
        <Select id="owner_id" label="Proprietário" options={owners} placeholder="Selecione…" required />
        <Input id="share_pct" label="Participação %" inputMode="decimal" defaultValue={String(remaining || 100)} required />
        <div className="sm:w-36"><SubmitButton pendingLabel="Vinculando…">Vincular</SubmitButton></div>
      </div>
    </form>
  );
}
