import { money } from "@/lib/format";

type Row = { month: string; received: number; open: number };
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Barras empilhadas (recebido × em aberto) — SVG/CSS puro, sem biblioteca. */
export function RevenueBars({ data }: { data: Row[] }) {
  const max = Math.max(1, ...data.map((d) => Number(d.received) + Number(d.open)));
  const hasData = data.some((d) => Number(d.received) + Number(d.open) > 0);
  return (
    <figure>
      <div className="flex h-52 items-end gap-3 sm:gap-5" role="img"
        aria-label={`Recebimentos dos últimos ${data.length} meses`}>
        {data.map((d) => {
          const r = (Number(d.received) / max) * 100;
          const o = (Number(d.open) / max) * 100;
          const [, m] = d.month.split("-");
          return (
            <div key={d.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="relative flex w-full max-w-12 flex-1 flex-col justify-end overflow-hidden rounded-[14px] bg-mist">
                <div className="w-full bg-rose-line transition-[height] duration-700" style={{ height: `${o}%` }} />
                <div className="w-full bg-vinho transition-[height] duration-700" style={{ height: `${r}%` }} />
                <span className="pointer-events-none absolute inset-x-0 top-2 hidden text-center text-[10px] font-medium text-charcoal group-hover:block">
                  {money(Number(d.received))}
                </span>
              </div>
              <span className="text-xs text-stone">{MONTHS[Number(m) - 1]}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center gap-4 text-xs text-stone">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-vinho" /> Recebido</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-rose-line" /> Em aberto</span>
        {!hasData && <span>· Nenhum boleto lançado no período</span>}
      </figcaption>
    </figure>
  );
}

/** Barra horizontal segmentada (distribuição por status). */
export function Segments({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-mist" role="img"
        aria-label={items.map((i) => `${i.label}: ${i.value}`).join(", ")}>
        {total > 0 && items.map((i) => (
          <div key={i.label} style={{ width: `${(i.value / total) * 100}%`, background: i.color }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {items.map((i) => (
          <li key={i.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-graphite"><span className="size-2.5 rounded-full" style={{ background: i.color }} />{i.label}</span>
            <span className="heading font-semibold">{i.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
