/**
 * Roteiro de cada módulo (do prompt de desenvolvimento). As telas abaixo ainda
 * não têm formulários: o schema, as permissões e as notificações já existem no
 * banco; a interface entra na etapa indicada.
 */
export type Planned = { title: string; accent: string; stage: string; features: string[] };

export const ADMIN_MODULES: Record<string, Planned> = {
  chamados: { title: "Chamados", accent: "de manutenção", stage: "Etapa 4", features: ["Fila com prioridade, responsável e prazo", "Linha do tempo com comentários e notas internas", "Anexos de fotos, vídeos e documentos", "Status: novo → em análise → aguardando terceiro → em andamento → concluído"] },
  comunicados: { title: "Comunicados", accent: "e notícias", stage: "Etapa 6", features: ["Avisos gerais ou por perfil, imóvel ou usuário", "Agendamento de publicação", "Distribuição automática na central de notificações", "Envio por e-mail e WhatsApp quando configurados"] },
  indicacoes: { title: "Indique", accent: "e Ganhe", stage: "Etapa 4", features: ["Regras, recompensa, critérios e validade do programa", "Funil: recebida → em contato → convertida", "Liberação de recompensa apenas com validação do admin"] },
  relatorios: { title: "Relatórios", accent: "operacionais", stage: "Etapa 7", features: ["Indicadores financeiros e de ocupação por período", "Inadimplência e tempo médio de chamados", "Exportação CSV/Excel"] },
  configuracoes: { title: "Configurações", accent: "do sistema", stage: "Etapa 6", features: ["Usuários, papéis e bloqueio de contas", "Dados institucionais e número oficial de WhatsApp", "Dias de antecedência dos lembretes e fuso horário", "Status das integrações: e-mail, WhatsApp Business, pagamentos, assinatura digital", "Histórico de atividades (auditoria)"] },
};

export const OWNER_MODULES: Record<string, Planned> = {
  imoveis: { title: "Meus", accent: "imóveis", stage: "Etapa 5", features: ["Galeria de fotos e ficha completa", "Situação de locação de cada imóvel", "Chamados de manutenção em andamento"] },
  avisos: { title: "Avisos", accent: "e notícias", stage: "Etapa 5", features: ["Comunicados da Empiric sobre seus imóveis"] },
};

export const TENANT_MODULES: Record<string, Planned> = {
  chamados: { title: "Central de", accent: "manutenção", stage: "Etapa 4", features: ["Abrir chamado com categoria, prioridade e descrição", "Anexar fotos, vídeos e documentos", "Acompanhar etapas e conversar com a Empiric"] },
  avisos: { title: "Avisos", accent: "e novidades", stage: "Etapa 4", features: ["Comunicados, novidades e notícias da Empiric"] },
  indique: { title: "Indique", accent: "e Ganhe", stage: "Etapa 4", features: ["Cadastrar indicação com nome e contato", "Acompanhar status da indicação", "Regras e recompensa do programa"] },
};
