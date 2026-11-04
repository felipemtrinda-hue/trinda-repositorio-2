"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Plus, Trash2, X } from "lucide-react";
import { createInvoice } from "@/lib/actions/invoices";
import { uploadDocument } from "@/lib/upload-client";
import { DOC_TYPES, validateFile } from "@/lib/documents";
import { parseMoney } from "@/lib/validation";
import { money } from "@/lib/format";
import { FormMessage } from "@/components/ui/field";
import { FormSection, Grid, Input, Select } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";

type Lease = { value: string; label: string; status: string; due_day: number; rent: number };
type Item = { label: string; amount: string };

const pad = (n: number) => String(n).padStart(2, "0");
function nextMonth() { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
function dueFor(competence: string, day: number) {
  const [y, m] = competence.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${competence}-${pad(Math.min(day, last))}`;
}

export function InvoiceForm({ leases, initialLease }: { leases: Lease[]; initialLease?: string }) {
  const router = useRouter();
  const active = leases.filter((l) => l.status === "active" || l.value === initialLease);
  const [leaseId, setLeaseId] = useState(initialLease ?? active[0]?.value ?? "");
  const lease = active.find((l) => l.value === leaseId);
  const [competence, setCompetence] = useState(nextMonth());
  const [due, setDue] = useState(lease ? dueFor(nextMonth(), lease.due_day) : "");
  const [items, setItems] = useState<Item[]>([{ label: "Aluguel", amount: lease ? lease.rent.toFixed(2).replace(".", ",") : "" }]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const total = useMemo(() => items.reduce((s, i) => s + (parseMoney(i.amount) || 0), 0), [items]);

  function chooseLease(id: string) {
    setLeaseId(id);
    const l = active.find((x) => x.value === id);
    if (l) { setDue(dueFor(competence, l.due_day)); setItems((it) => [{ label: "Aluguel", amount: l.rent.toFixed(2).replace(".", ",") }, ...it.slice(1)]); }
  }
  function chooseCompetence(c: string) { setCompetence(c); if (lease && c) setDue(dueFor(c, lease.due_day)); }

  async function submit(fd: FormData) {
    setError(null); setBusy(true);
    let pdf_path: string | null = null;
    if (file) {
      const up = await uploadDocument(file, "invoice");
      if ("error" in up) { setError(up.error); setBusy(false); return; }
      pdf_path = up.path;
    }
    const res = await createInvoice({
      lease_id: leaseId, competence, due_date: due, items, pdf_path,
      barcode: fd.get("barcode"), pix_code: fd.get("pix_code"), publish: fd.get("publish") === "on",
    });
    if (res.error) { setError(res.error); setBusy(false); return; }
    router.push(`/admin/financeiro/${res.id}?ok=boleto_salvo`);
  }

  if (!active.length) return <FormMessage error="Nenhum contrato ativo. Ative um contrato antes de lançar boletos." />;

  return (
    <form action={submit} className="space-y-4" noValidate>
      <FormMessage error={error ?? undefined} />
      <FormSection title="Cobrança">
        <Grid cols={3}>
          <Select id="lease_id" label="Contrato" options={active} value={leaseId} onChange={(e) => chooseLease(e.target.value)} className="md:col-span-3" />
          <Input id="competence" label="Competência" type="month" required value={competence} onChange={(e) => chooseCompetence(e.target.value)} />
          <Input id="due_date" label="Vencimento" type="date" required value={due} onChange={(e) => setDue(e.target.value)} hint={lease ? `Dia ${lease.due_day} pelo contrato` : undefined} />
        </Grid>
      </FormSection>

      <FormSection title="Itens da fatura" description="O inquilino vê este detalhamento no app."
        aside={<p className="heading text-right text-2xl font-bold tabular-nums">{money(total)}</p>}>
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="grid grid-cols-[1fr_140px_40px] gap-2">
              <input aria-label={`Descrição do item ${i + 1}`} value={it.label} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                className="h-12 rounded-[14px] bg-mist px-4 text-sm focus:bg-paper focus:shadow-[0_0_0_4px_var(--color-rose-mist)] focus:outline-none" placeholder="Condomínio" />
              <input aria-label={`Valor do item ${i + 1}`} inputMode="decimal" value={it.amount} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
                className="h-12 rounded-[14px] bg-mist px-4 text-right text-sm tabular-nums focus:bg-paper focus:shadow-[0_0_0_4px_var(--color-rose-mist)] focus:outline-none" placeholder="0,00" />
              <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} disabled={items.length === 1}
                className="grid size-12 place-items-center rounded-full text-stone hover:bg-danger-bg hover:text-danger disabled:opacity-30" aria-label="Remover item"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setItems([...items, { label: "", amount: "" }])} className={buttonClass("secondary", "sm")}><Plus className="size-4" /> Item</button>
          {["Condomínio", "IPTU", "Taxa de lixo", "Desconto"].filter((l) => !items.some((i) => i.label === l)).map((l) => (
            <button key={l} type="button" onClick={() => setItems([...items, { label: l, amount: l === "Desconto" ? "-" : "" }])} className="h-9 rounded-full px-3 text-sm text-stone hover:bg-mist">+ {l}</button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Pagamento" description="Cole a linha digitável e/ou o Pix copia-e-cola gerados no banco.">
        <div className="space-y-4">
          <Input id="barcode" label="Linha digitável" inputMode="numeric" placeholder="00190.00009 01234.567890 …" />
          <Input id="pix_code" label="Pix copia e cola" placeholder="00020126…" />
          {!file ? (
            <label className="flex cursor-pointer items-center gap-3 rounded-[16px] border-2 border-dashed border-smoke bg-mist px-4 py-4 text-sm text-stone hover:border-bordo/50">
              <FileUp className="size-5" aria-hidden /> Anexar PDF do boleto (opcional)
              <input type="file" hidden accept={DOC_TYPES.join(",")} onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const er = validateFile(f); setError(er); if (!er) setFile(f); }} />
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-[16px] bg-mist px-4 py-3 text-sm">
              <span className="min-w-0 flex-1 truncate font-semibold">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="grid size-8 place-items-center rounded-full bg-paper" aria-label="Remover arquivo"><X className="size-4" /></button>
            </div>
          )}
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="publish" defaultChecked className="size-5 accent-[var(--color-bordo)]" /> Publicar agora e avisar o inquilino
          </label>
        </div>
      </FormSection>

      <div className="flex justify-end">
        <button type="submit" disabled={busy} className={buttonClass("primary", "lg", "w-full sm:w-60")}>
          {busy ? <><Loader2 className="size-4 animate-spin" /> Salvando…</> : `Lançar boleto · ${money(total)}`}
        </button>
      </div>
    </form>
  );
}
