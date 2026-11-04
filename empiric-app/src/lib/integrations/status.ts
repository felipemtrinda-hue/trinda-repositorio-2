import "server-only";

/**
 * Estado das integrações externas. Sem credenciais, nada é enviado nem
 * simulado: a entrega fica marcada como "skipped_not_configured" e o painel
 * de Configurações mostra a pendência.
 */
export const integrations = {
  email: () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  whatsapp: () => Boolean(process.env.WHATSAPP_BUSINESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
};
