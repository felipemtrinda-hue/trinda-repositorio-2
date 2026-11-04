import { z } from "zod";

/** Texto opcional: vazio vira null. */
export const optText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v),
  z.string().max(2000).nullable(),
);
export const reqText = (msg: string) => z.string({ error: msg }).trim().min(1, msg).max(500);

/** "1.850,00", "1850,5" ou "1850.50" → 1850.5 */
export function parseMoney(v: unknown): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const s = v.replace(/[R$\s]/g, "");
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}
export const optMoney = z.preprocess(parseMoney, z.number({ error: "Valor inválido." }).nonnegative("Valor inválido.").nullable());
export const reqMoney = (msg: string) => z.preprocess(parseMoney, z.number({ error: msg }).positive(msg));

export const optInt = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number({ error: "Número inválido." }).int("Use um número inteiro.").min(0).max(9999).nullable(),
);
export const optDecimal = z.preprocess(
  (v) => (v === "" || v == null ? null : parseMoney(String(v))),
  z.number({ error: "Número inválido." }).nonnegative().nullable(),
);

export const digits = (v: unknown) => (typeof v === "string" ? v.replace(/\D/g, "") : v);
export const optPhone = z.preprocess(
  (v) => { const d = digits(v); return d === "" ? null : d; },
  z.string().regex(/^\d{10,13}$/, "Telefone inválido (use DDD).").nullable(),
);
export const optDocument = z.preprocess(
  (v) => { const d = digits(v); return d === "" ? null : d; },
  z.string().refine((d) => isCpf(d) || d.length === 14, "CPF ou CNPJ inválido.").nullable(),
);
export const isoDate = (msg: string) => z.string({ error: msg }).regex(/^\d{4}-\d{2}-\d{2}$/, msg);

export function isCpf(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export type FormState = { error?: string; ok?: string; values?: Record<string, string> };

/** Primeira mensagem de erro + valores digitados (para não perder o formulário). */
export function fail(form: FormData, error: string): FormState {
  const values: Record<string, string> = {};
  form.forEach((v, k) => { if (typeof v === "string") values[k] = v; });
  return { error, values };
}

/** Traduz erros comuns do Postgres para mensagens de usuário. */
export function dbError(err: { code?: string; message?: string } | null): string {
  if (!err) return "Erro inesperado.";
  if (err.code === "23505") return "Já existe um registro com esses dados (código ou competência duplicada).";
  if (err.code === "23514") return err.message?.includes("Somente") || err.message?.includes("contrato") || err.message?.includes("soma")
    ? err.message : "Algum valor está fora do permitido. Confira datas e números.";
  if (err.code === "23503") return "Este registro está em uso e não pode ser removido.";
  if (err.code === "42501") return "Você não tem permissão para esta ação.";
  if (err.message?.includes("leases_one_active_per_property")) return "Este imóvel já tem um contrato ativo.";
  return "Não foi possível salvar. Tente novamente.";
}
