import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent } from "@/lib/actions/calendar";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { FormSection } from "@/components/ui/form";
import { EventForm } from "@/components/admin/event-form";
import { money } from "@/lib/format";
import { eventKind } from "@/lib/labels";
import {
  MONTHS_LONG, WEEKDAYS, WEEKDAYS_LONG, addDays, addMonths, isValidDay, startOfMonth, startOfWeek, toSPDate, toSPTime, todaySP,
} from "@/lib/dates";

export const metadata = { title: "Agenda" };

type View = "mes" | "semana" | "dia";
type Ev = { id: string; day: string; time: string | null; title: string; kind: string; manual: boolean; href?: string };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ v?: string; data?: string; tipo?: string; imovel?: string }> }) {
  const sp = await searchParams;
  const view: View = sp.v === "semana" || sp.v === "dia" ? sp.v : "mes";
  const today = todaySP();
  const day = isValidDay(sp.data) ? sp.data : today;
  const tipo = sp.tipo && eventKind[sp.tipo] ? sp.tipo : "";
  const imovel = sp.imovel ?? "";

  // Intervalo visível
  const from = view === "mes" ? startOfWeek(startOfMonth(day)) : view === "semana" ? startOfWeek(day) : day;
  const days = view === "mes" ? 42 : view === "semana" ? 7 : 1;
  const to = addDays(from, days);

  const supabase = await createClient();
  let evq = supabase.from("calendar_events").select("id, title, kind, starts_at, all_day, created_by, lease_id, property_id")
    .gte("starts_at", `${from}T00:00:00-03:00`).lt("starts_at", `${to}T00:00:00-03:00`).order("starts_at").limit(500);
  if (tipo && tipo !== "invoice_due") evq = evq.eq("kind", tipo);
  if (imovel) evq = evq.eq("property_id", imovel);
  const invq = supabase.from("invoices").select("id, due_date, amount, status, lease:leases(property_id, property:properties(title))")
    .gte("due_date", from).lt("due_date", to).in("status", ["pending", "overdue"]).limit(500);

  const [{ data: evs }, { data: invs }, { data: props }] = await Promise.all([
    tipo === "invoice_due" ? Promise.resolve({ data: [] }) : evq,
    !tipo || tipo === "invoice_due" ? invq : Promise.resolve({ data: [] }),
    supabase.from("properties").select("id, title").neq("status", "archived").order("title"),
  ]);

  const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
  const events: Ev[] = [
    ...(evs ?? []).map((e) => ({
      id: e.id, day: toSPDate(e.starts_at), time: e.all_day ? null : toSPTime(e.starts_at), title: e.title, kind: e.kind,
      manual: Boolean(e.created_by), href: e.lease_id ? `/admin/contratos/${e.lease_id}` : undefined,
    })),
    ...(invs ?? []).flatMap((i) => {
      const lease = one(i.lease) as { property_id: string; property: { title: string } | { title: string }[] } | null;
      if (imovel && lease?.property_id !== imovel) return [];
      return [{ id: `inv-${i.id}`, day: i.due_date, time: null, kind: "invoice_due", manual: false,
        title: `Vencimento ${money(i.amount)} · ${(one(lease?.property ?? []) as { title: string } | undefined)?.title ?? ""}` }];
    }),
  ];
  const byDay = new Map<string, Ev[]>();
  events.forEach((e) => byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]));

  const step = (n: number) => (view === "mes" ? addMonths(day, n) : addDays(day, n * (view === "semana" ? 7 : 1)));
  const qs = (o: Record<string, string>) => {
    const p = new URLSearchParams({ v: view, data: day, ...(tipo && { tipo }), ...(imovel && { imovel }), ...o });
    return `/admin/agenda?${p}`;
  };
  const [y, m, dd] = day.split("-").map(Number);
  const heading = view === "mes" ? `${MONTHS_LONG[m - 1]} ${y}`
    : view === "semana" ? `Semana de ${from.slice(8)}/${from.slice(5, 7)}`
    : `${WEEKDAYS_LONG[new Date(`${day}T12:00:00Z`).getUTCDay()]}, ${dd} de ${MONTHS_LONG[m - 1]}`;
  const propertyOpts = (props ?? []).map((p) => ({ value: p.id, label: p.title }));

  const Chip = ({ e }: { e: Ev }) => {
    const [label, color] = eventKind[e.kind] ?? [e.kind, "#424245"];
    const body = (
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
        <span className="truncate">{e.time && <b className="font-semibold">{e.time} </b>}{e.title}</span>
        <span className="sr-only">({label})</span>
      </span>
    );
    return e.href ? <Link href={e.href} className="block rounded-lg px-1.5 py-0.5 text-[11.5px] hover:bg-mist">{body}</Link>
      : <span className="block rounded-lg px-1.5 py-0.5 text-[11.5px]">{body}</span>;
  };

  return (
    <>
      <PageHeader eyebrow="Agenda geral" title="Datas que" accent="importam." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Link href={qs({ data: step(-1) })} className="grid size-10 place-items-center rounded-full bg-mist hover:bg-[#ebebef]" aria-label="Anterior"><ChevronLeft className="size-4" /></Link>
          <Link href={qs({ data: today })} className="h-10 rounded-full bg-mist px-4 text-sm font-semibold leading-10 hover:bg-[#ebebef]">Hoje</Link>
          <Link href={qs({ data: step(1) })} className="grid size-10 place-items-center rounded-full bg-mist hover:bg-[#ebebef]" aria-label="Próximo"><ChevronRight className="size-4" /></Link>
          <h2 className="heading ml-2 text-xl font-bold capitalize">{heading}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-mist p-1" role="tablist" aria-label="Visualização">
            {(["mes", "semana", "dia"] as View[]).map((vw) => (
              <Link key={vw} href={qs({ v: vw })} role="tab" aria-selected={view === vw}
                className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium ${view === vw ? "bg-paper shadow-[var(--shadow-card)]" : "text-stone"}`}>
                {{ mes: "Mês", semana: "Semana", dia: "Dia" }[vw]}
              </Link>
            ))}
          </div>
          <form className="flex w-full flex-wrap gap-2 sm:w-auto">
            <input type="hidden" name="v" value={view} /><input type="hidden" name="data" value={day} />
            <select name="tipo" defaultValue={tipo} className="h-10 min-w-0 flex-1 rounded-full bg-mist px-4 text-sm sm:flex-none" aria-label="Filtrar por tipo">
              <option value="">Todos os tipos</option>
              {Object.entries(eventKind).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <select name="imovel" defaultValue={imovel} className="h-10 min-w-0 flex-1 rounded-full bg-mist px-4 text-sm sm:max-w-44 sm:flex-none" aria-label="Filtrar por imóvel">
              <option value="">Todos os imóveis</option>
              {propertyOpts.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button className="h-10 rounded-full bg-charcoal px-4 text-sm font-semibold text-white">Filtrar</button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          {view === "dia" ? (
            <ul className="divide-y divide-cream">
              {(byDay.get(day) ?? []).map((e) => {
                const [label, color] = eventKind[e.kind] ?? [e.kind, "#424245"];
                return (
                  <li key={e.id} className="flex items-center gap-4 px-6 py-4">
                    <span className="w-14 shrink-0 text-sm font-semibold">{e.time ?? "Dia"}</span>
                    <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      {e.href ? <Link href={e.href} className="block truncate font-semibold hover:text-bordo">{e.title}</Link> : <span className="block truncate font-semibold">{e.title}</span>}
                      <span className="text-xs text-stone">{label}</span>
                    </span>
                    {e.manual && (
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={e.id} /><input type="hidden" name="back" value={`v=dia&data=${day}`} />
                        <button className="grid size-9 place-items-center rounded-full text-stone hover:bg-danger-bg hover:text-danger" aria-label={`Remover ${e.title}`}><Trash2 className="size-4" /></button>
                      </form>
                    )}
                  </li>
                );
              })}
              {!byDay.get(day)?.length && <li className="px-6 py-16 text-center text-sm text-stone">Nada agendado para este dia.</li>}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[680px] grid-cols-7">
                {WEEKDAYS.map((w) => <div key={w} className="border-b border-cream px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone">{w}</div>)}
                {Array.from({ length: days }, (_, i) => {
                  const cur = addDays(from, i);
                  const outside = view === "mes" && cur.slice(5, 7) !== day.slice(5, 7);
                  const list = byDay.get(cur) ?? [];
                  const max = view === "mes" ? 3 : 12;
                  return (
                    <div key={cur} className={`border-b border-r border-cream p-1.5 ${view === "mes" ? "min-h-[112px]" : "min-h-[360px]"} ${outside ? "bg-mist/50" : ""} [&:nth-child(7n)]:border-r-0`}>
                      <Link href={qs({ v: "dia", data: cur })}
                        className={`mb-1 inline-grid size-7 place-items-center rounded-full text-xs font-semibold [@media(pointer:coarse)]:size-9 ${cur === today ? "bg-bordo text-white" : outside ? "text-stone/60" : "hover:bg-mist"}`}>
                        {Number(cur.slice(8))}
                      </Link>
                      {list.slice(0, max).map((e) => <Chip key={e.id} e={e} />)}
                      {list.length > max && <Link href={qs({ v: "dia", data: cur })} className="block px-1.5 text-[11px] font-semibold text-bordo">+{list.length - max} mais</Link>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <aside className="space-y-4">
          <FormSection title="Novo evento" description="Vistorias, repasses, tarefas e lembretes.">
            <EventForm day={day} properties={propertyOpts} />
          </FormSection>
          <FormSection title="Legenda">
            <ul className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(eventKind).map(([k, [l, c]]) => (
                <li key={k} className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: c }} />{l}</li>
              ))}
            </ul>
          </FormSection>
        </aside>
      </div>
    </>
  );
}
