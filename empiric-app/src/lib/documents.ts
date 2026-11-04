export const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const DOC_MAX = 25 * 1024 * 1024;

export const DOC_KIND_LABEL: Record<string, string> = {
  contract: "Contrato", inspection: "Laudo de vistoria", invoice: "Boleto", receipt: "Recibo",
  statement: "Demonstrativo", income_tax: "Imposto de Renda", personal: "Documento pessoal", other: "Outro",
};

export type UploadResult = { path: string; mime: string; size: number } | { error: string };

export function validateFile(f: File): string | null {
  if (!(DOC_TYPES as readonly string[]).includes(f.type)) return `"${f.name}": envie PDF, JPG, PNG ou WebP.`;
  if (f.size > DOC_MAX) return `"${f.name}" passa de 25 MB.`;
  if (f.size === 0) return `"${f.name}" está vazio.`;
  return null;
}
