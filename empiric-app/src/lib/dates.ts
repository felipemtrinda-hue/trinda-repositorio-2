/** Utilidades de calendário em datas puras (AAAA-MM-DD), sempre no fuso de Brasília. */
export const TZ = "America/Sao_Paulo";

export function todaySP() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}
export function toSPDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
}
export function toSPTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
const d = (s: string) => new Date(`${s}T12:00:00Z`);
const s = (x: Date) => x.toISOString().slice(0, 10);
export const addDays = (day: string, n: number) => { const x = d(day); x.setUTCDate(x.getUTCDate() + n); return s(x); };
export const addMonths = (day: string, n: number) => { const x = d(day); x.setUTCDate(1); x.setUTCMonth(x.getUTCMonth() + n); return s(x); };
export const weekday = (day: string) => d(day).getUTCDay(); // 0 = domingo
export const startOfWeek = (day: string) => addDays(day, -weekday(day));
export const startOfMonth = (day: string) => `${day.slice(0, 7)}-01`;
export const isValidDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(d(v).getTime());

export const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAYS_LONG = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
