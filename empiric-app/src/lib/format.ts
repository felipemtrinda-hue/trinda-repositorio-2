/** (42) 99958-4779 · (42) 3222-0000 */
export const phone = (v: string | null | undefined) => {
  const d = (v ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v ?? "";
};
/** 529.982.247-25 · 12.345.678/0001-90 */
export const docId = (v: string | null | undefined) => {
  const d = (v ?? "").replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return v ?? "";
};
/** 1850 → "1.850,00" para campos de valor */
export const moneyInput = (v: string | number | null | undefined) =>
  v == null || v === "" ? "" : new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v));

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const money = (v: number | string | null | undefined) => brl.format(Number(v ?? 0));
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
/** Datas puras (AAAA-MM-DD) não sofrem fuso; timestamps são exibidos no horário de Brasília. */
export const date = (v: string | Date | null | undefined) => {
  if (!v) return "—";
  if (typeof v === "string" && DATE_ONLY.test(v)) {
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  }
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(v));
};
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
/** Competência: "Nov/2026". */
export const monthYear = (v: string) => {
  const [y, m] = v.slice(0, 7).split("-");
  return `${MONTHS[Number(m) - 1]}/${y}`;
};
export const relative = (v: string) => {
  const diff = (Date.now() - new Date(v).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (diff < 3600) return rtf.format(-Math.max(1, Math.round(diff / 60)), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  return rtf.format(-Math.round(diff / 86400), "day");
};

/** Dias até a data (vencimento no fuso de Brasília). Negativo = vencido. */
export const daysUntil = (isoDate: string) =>
  Math.ceil((new Date(isoDate + "T12:00:00-03:00").getTime() - Date.now()) / 864e5);
