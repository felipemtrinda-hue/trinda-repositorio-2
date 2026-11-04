"use client";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, X } from "lucide-react";
import { registerDocument } from "@/lib/actions/documents";
import { uploadDocument } from "@/lib/upload-client";
import { DOC_KIND_LABEL, DOC_TYPES, validateFile } from "@/lib/documents";
import { FormMessage } from "@/components/ui/field";
import { FormSection, Grid, Input, Select } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";

type Opt = { value: string; label: string };
type Lease = { value: string; label: string; property_id: string };

export function DocUploader({ properties, leases, people, initial = {} }: {
  properties: Opt[]; leases: Lease[]; people: Opt[];
  initial?: Partial<Record<"kind" | "property_id" | "lease_id" | "recipient_id", string>>;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [kind, setKind] = useState(initial.kind ?? "contract");
  const [propertyId, setPropertyId] = useState(initial.property_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "upload" | "save">("idle");
  const [, start] = useTransition();
  const busy = step !== "idle";
  const leaseOpts = useMemo(() => leases.filter((l) => !propertyId || l.property_id === propertyId), [leases, propertyId]);
  const year = new Date().getFullYear();

  function pick(f: File | undefined) {
    if (!f) return;
    const err = validateFile(f);
    setError(err);
    if (err) return;
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  async function submit(fd: FormData) {
    if (!file) { setError("Escolha o arquivo."); return; }
    setError(null);
    setStep("upload");
    const up = await uploadDocument(file, kind);
    if ("error" in up) { setError(up.error); setStep("idle"); return; }
    setStep("save");
    const res = await registerDocument({
      kind, title: fd.get("title"), path: up.path,
      property_id: fd.get("property_id"), lease_id: fd.get("lease_id"), recipient_id: fd.get("recipient_id"),
      base_year: fd.get("base_year"), competence: fd.get("competence"), publish: fd.get("publish") === "on",
    });
    if (res.error) { setError(res.error); setStep("idle"); return; }
    start(() => router.push("/admin/documentos?ok=doc_enviado"));
  }

  return (
    <form action={submit} className="space-y-4" noValidate>
      <FormMessage error={error ?? undefined} />
      <FormSection title="Arquivo" description="PDF ou imagem de até 25 MB. Fica em armazenamento privado.">
        {!file ? (
          <button type="button" onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-smoke bg-mist px-6 py-10 text-sm text-stone transition hover:border-bordo/50 hover:text-bordo">
            <FileUp className="size-7" aria-hidden />
            <span className="font-semibold text-charcoal">Escolher arquivo</span>
            <span>ou arraste aqui</span>
          </button>
        ) : (
          <div className="flex items-center gap-4 rounded-[20px] bg-mist p-4">
            {preview
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={preview} alt="Pré-visualização" className="size-16 rounded-xl object-cover" />
              : <span className="grid size-16 place-items-center rounded-xl bg-paper text-xs font-bold text-bordo">PDF</span>}
            <span className="min-w-0 flex-1 text-sm"><span className="block truncate font-semibold">{file.name}</span><span className="text-stone">{(file.size / 1048576).toFixed(2)} MB</span></span>
            {!busy && <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="grid size-9 place-items-center rounded-full bg-paper" aria-label="Trocar arquivo"><X className="size-4" /></button>}
          </div>
        )}
        <input ref={input} type="file" hidden accept={DOC_TYPES.join(",")} onChange={(e) => pick(e.target.files?.[0])} />
      </FormSection>

      <FormSection title="Informações">
        <Grid>
          <Select id="kind" label="Tipo" value={kind} onChange={(e) => setKind(e.target.value)}
            options={Object.entries(DOC_KIND_LABEL).filter(([k]) => k !== "invoice").map(([value, label]) => ({ value, label }))} />
          <Input id="title" label="Título" required placeholder={kind === "income_tax" ? `Informe de rendimentos ${year - 1}` : "Contrato de locação assinado"} />
          {kind === "income_tax" && <Input id="base_year" label="Ano-base" type="number" min={2000} max={2100} defaultValue={String(year - 1)} required />}
          {(kind === "receipt" || kind === "statement") && <Input id="competence" label="Competência" type="month" required />}
        </Grid>
      </FormSection>

      <FormSection title="Para quem" description="Inquilinos veem contrato, vistoria e documentos do contrato. Proprietários veem recibos, demonstrativos e IR do imóvel. Para um documento só de uma pessoa, escolha o destinatário.">
        <Grid cols={3}>
          <Select id="property_id" label="Imóvel" options={properties} placeholder="—" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} />
          <Select id="lease_id" label="Contrato" options={leaseOpts} placeholder="—" defaultValue={initial.lease_id} />
          <Select id="recipient_id" label="Pessoa específica" options={people} placeholder="—" defaultValue={initial.recipient_id} />
        </Grid>
        <label className="mt-5 flex items-center gap-3 text-sm">
          <input type="checkbox" name="publish" defaultChecked className="size-5 accent-[var(--color-bordo)]" />
          Publicar agora e avisar os destinatários
        </label>
      </FormSection>

      <div className="flex justify-end">
        <button type="submit" disabled={busy} className={buttonClass("primary", "lg", "w-full sm:w-60")}>
          {busy ? <><Loader2 className="size-4 animate-spin" /> {step === "upload" ? "Enviando arquivo…" : "Salvando…"}</> : "Enviar documento"}
        </button>
      </div>
    </form>
  );
}
