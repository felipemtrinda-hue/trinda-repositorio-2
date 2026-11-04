const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const money = (v: number | string | null | undefined) => brl.format(Number(v ?? 0));
export const date = (v: string | Date | null | undefined) =>
  v ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(v)) : "—";
export const monthYear = (v: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(v));
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
