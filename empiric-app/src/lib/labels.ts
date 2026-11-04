import type { BadgeTone } from "@/components/ui/badge";

export const propertyStatus: Record<string, [string, BadgeTone]> = {
  available: ["Disponível", "success"], rented: ["Alugado", "brand"], reserved: ["Reservado", "info"],
  maintenance: ["Em manutenção", "warning"], archived: ["Arquivado", "neutral"],
};
export const invoiceStatus: Record<string, [string, BadgeTone]> = {
  pending: ["Em aberto", "info"], paid: ["Pago", "success"], overdue: ["Vencido", "danger"], cancelled: ["Cancelado", "neutral"],
};
export const ticketStatus: Record<string, [string, BadgeTone]> = {
  new: ["Novo", "brand"], analysis: ["Em análise", "info"], waiting_third_party: ["Aguardando terceiro", "warning"],
  in_progress: ["Em andamento", "info"], done: ["Concluído", "success"], cancelled: ["Cancelado", "neutral"],
};
export const actionLabel: Record<string, string> = {
  create: "cadastrou", update: "atualizou", delete: "excluiu", upload: "enviou", status_change: "alterou o status de",
  login: "entrou no sistema", send: "enviou", download: "baixou",
};
export const entityLabel: Record<string, string> = {
  properties: "imóvel", profiles: "usuário", leases: "contrato", documents: "documento", invoices: "boleto",
  payments: "pagamento", tickets: "chamado", ticket_attachments: "anexo", announcements: "comunicado",
  referrals: "indicação", settings: "configuração", integrations: "integração", property_owners: "vínculo", auth: "",
};
export const leaseStatus: Record<string, [string, BadgeTone]> = {
  draft: ["Rascunho", "neutral"], awaiting_signature: ["Aguardando assinatura", "warning"],
  active: ["Ativo", "success"], ended: ["Encerrado", "neutral"], cancelled: ["Cancelado", "danger"],
};
export const accountStatus: Record<string, [string, BadgeTone]> = {
  invited: ["Convite enviado", "warning"], active: ["Ativo", "success"], blocked: ["Bloqueado", "danger"],
};
export const eventKind: Record<string, [string, string]> = {
  invoice_due: ["Vencimento", "#2a5bd7"], lease_start: ["Início de contrato", "#1d7a4a"], lease_end: ["Fim de contrato", "#8c1c3e"],
  inspection: ["Vistoria", "#9a5b00"], maintenance: ["Manutenção", "#c4271b"], payout: ["Repasse", "#5b3fd1"],
  task: ["Tarefa", "#424245"], reminder: ["Lembrete", "#b8325a"],
};
