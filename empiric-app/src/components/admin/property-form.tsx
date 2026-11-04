"use client";
import { useActionState, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { saveProperty } from "@/lib/actions/properties";
import type { FormState } from "@/lib/validation";
import { FormMessage } from "@/components/ui/field";
import { FormSection, Grid, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export type PropertyValues = Partial<Record<
  "id" | "title" | "code" | "kind" | "status" | "description" | "zip_code" | "street" | "number" | "complement" |
  "district" | "city" | "state" | "bedrooms" | "bathrooms" | "parking_spots" | "area_m2" | "rent_amount" |
  "condo_amount" | "iptu_amount" | "features", string>>;

const KINDS = [
  { value: "apartment", label: "Apartamento" }, { value: "house", label: "Casa" },
  { value: "commercial", label: "Comercial" }, { value: "land", label: "Terreno" }, { value: "other", label: "Outro" },
];
const STATUSES = [
  { value: "available", label: "Disponível" }, { value: "rented", label: "Alugado" },
  { value: "reserved", label: "Reservado" }, { value: "maintenance", label: "Em manutenção" },
];

export function PropertyForm({ initial = {} }: { initial?: PropertyValues }) {
  const [state, action] = useActionState<FormState, FormData>(saveProperty, {});
  const v = { ...initial, ...state.values };
  const [addr, setAddr] = useState({ street: v.street ?? "", district: v.district ?? "", city: v.city ?? "", state: v.state ?? "" });
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "error">("idle");

  async function lookupCep(raw: string) {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await res.json();
      if (d.erro) throw new Error();
      setAddr({ street: d.logradouro || addr.street, district: d.bairro || addr.district, city: d.localidade, state: d.uf });
      setCepStatus("idle");
    } catch { setCepStatus("error"); }
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <FormMessage error={state.error} />

      <FormSection title="Identificação">
        <Grid cols={3}>
          <Input id="title" label="Título" required defaultValue={v.title} placeholder="Apto 302 · Ed. Aurora" className="md:col-span-2" />
          <Input id="code" label="Código interno" defaultValue={v.code} placeholder="EMP-0123" />
          <Select id="kind" label="Tipo" options={KINDS} defaultValue={v.kind ?? "apartment"} />
          <Select id="status" label="Situação" options={STATUSES} defaultValue={v.status ?? "available"} />
        </Grid>
        <Textarea id="description" label="Descrição" defaultValue={v.description} className="mt-4" placeholder="Pontos fortes, acabamento, posição solar…" />
      </FormSection>

      <FormSection title="Endereço">
        <Grid cols={4}>
          <div className="relative">
            <Input id="zip_code" label="CEP" inputMode="numeric" maxLength={9} defaultValue={v.zip_code} placeholder="84000-000"
              onBlur={(e) => lookupCep(e.currentTarget.value)}
              hint={cepStatus === "error" ? "CEP não encontrado — preencha manualmente." : "Preenche o endereço automaticamente."} />
            <span className="pointer-events-none absolute right-4 top-[42px] text-stone">
              {cepStatus === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </span>
          </div>
          <Input id="street" label="Rua" required value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} className="lg:col-span-2" />
          <Input id="number" label="Número" defaultValue={v.number} />
          <Input id="complement" label="Complemento" defaultValue={v.complement} placeholder="Ap 302, bloco B" />
          <Input id="district" label="Bairro" value={addr.district} onChange={(e) => setAddr({ ...addr, district: e.target.value })} />
          <Input id="city" label="Cidade" required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
          <Input id="state" label="UF" required maxLength={2} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value.toUpperCase() })} />
        </Grid>
      </FormSection>

      <FormSection title="Características e valores">
        <Grid cols={4}>
          <Input id="bedrooms" label="Quartos" type="number" min={0} defaultValue={v.bedrooms} />
          <Input id="bathrooms" label="Banheiros" type="number" min={0} defaultValue={v.bathrooms} />
          <Input id="parking_spots" label="Vagas" type="number" min={0} defaultValue={v.parking_spots} />
          <Input id="area_m2" label="Área (m²)" inputMode="decimal" defaultValue={v.area_m2} />
          <Input id="rent_amount" label="Aluguel (R$)" inputMode="decimal" defaultValue={v.rent_amount} placeholder="1.850,00" />
          <Input id="condo_amount" label="Condomínio (R$)" inputMode="decimal" defaultValue={v.condo_amount} />
          <Input id="iptu_amount" label="IPTU mensal (R$)" inputMode="decimal" defaultValue={v.iptu_amount} />
        </Grid>
        <Input id="features" label="Diferenciais" defaultValue={v.features} className="mt-4" placeholder="Sacada, churrasqueira, mobiliado" hint="Separe por vírgula." />
      </FormSection>

      <div className="flex justify-end">
        <div className="w-full sm:w-60"><SubmitButton>{v.id ? "Salvar alterações" : "Cadastrar imóvel"}</SubmitButton></div>
      </div>
    </form>
  );
}
