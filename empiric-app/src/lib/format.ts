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
