/**
 * Roteiro de cada módulo (do prompt de desenvolvimento). As telas abaixo ainda
 * não têm formulários: o schema, as permissões e as notificações já existem no
 * banco; a interface entra na etapa indicada.
 */
export type Planned = { title: string; accent: string; stage: string; features: string[] };

export const ADMIN_MODULES: Record<string, Planned> = {
  proprietarios: { title: "Proprietários", accent: "e vínculos", stage: "Etapa 2", features: ["Cadastro e contatos", "Documentos pessoais", "Imóveis vinculados e % de participação", "Histórico de repasses e atividades", "Convite de acesso ao portal"] },
  inquilinos: { title: "Inquilinos", accent: "e locações", stage: "Etapa 2", features: ["Cadastro e contatos", "Imóvel ocupado e contrato vigente", "Histórico de chamados e pagamentos", "Convite, bloqueio e redefinição de acesso"] },
  contratos: { title: "Contratos", accent: "de locação", stage: "Etapa 2", features: ["Cadastro com início, fim, dia de vencimento e valores", "Upload do contrato assinado e laudo de vistoria", "Alerta de renovação configurável", "Status: rascunho, aguardando assinatura, ativo, encerrado"] },
  financeiro: { title: "Boletos", accent: "e recibos", stage: "Etapa 3", features: ["Anexar boleto por competência, vencimento e valor", "Itens da fatura (aluguel, condomínio, IPTU…)", "Registro manual de pagamento ou webhook do gateway", "Recibos e demonstrativos mensais aos proprietários", "Informe anual de Imposto de Renda por ano-base"] },
  chamados: { title: "Chamados", accent: "de manutenção", stage: "Etapa 4", features: ["Fila com prioridade, responsável e prazo", "Linha do tempo com comentários e notas internas", "Anexos de fotos, vídeos e documentos", "Status: novo → em análise → aguardando terceiro → em andamento → concluído"] },
  agenda: { title: "Agenda", accent: "geral", stage: "Etapa 2", features: ["Visões mensal, semanal e diária", "Vencimentos, contratos, vistorias, manutenções e tarefas", "Filtros por tipo, imóvel, pessoa e responsável", "Lembretes manuais e visibilidade para proprietário/inquilino"] },
  comunicados: { title: "Comunicados", accent: "e notícias", stage: "Etapa 6", features: ["Avisos gerais ou por perfil, imóvel ou usuário", "Agendamento de publicação", "Distribuição automática na central de notificações", "Envio por e-mail e WhatsApp quando configurados"] },
  indicacoes: { title: "Indique", accent: "e Ganhe", stage: "Etapa 4", features: ["Regras, recompensa, critérios e validade do programa", "Funil: recebida → em contato → convertida", "Liberação de recompensa apenas com validação do admin"] },
  relatorios: { title: "Relatórios", accent: "operacionais", stage: "Etapa 7", features: ["Indicadores financeiros e de ocupação por período", "Inadimplência e tempo médio de chamados", "Exportação CSV/Excel"] },
  configuracoes: { title: "Configurações", accent: "do sistema", stage: "Etapa 6", features: ["Usuários, papéis e bloqueio de contas", "Dados institucionais e número oficial de WhatsApp", "Dias de antecedência dos lembretes e fuso horário", "Status das integrações: e-mail, WhatsApp Business, pagamentos, assinatura digital", "Histórico de atividades (auditoria)"] },
};

export const OWNER_MODULES: Record<string, Planned> = {
  imoveis: { title: "Meus", accent: "imóveis", stage: "Etapa 5", features: ["Galeria de fotos e ficha completa", "Situação de locação de cada imóvel", "Chamados de manutenção em andamento"] },
  financeiro: { title: "Recibos", accent: "mensais", stage: "Etapa 5", features: ["Recibos e demonstrativos por competência", "Histórico financeiro por imóvel", "Visualização e download em PDF"] },
  documentos: { title: "Seus", accent: "documentos", stage: "Etapa 5", features: ["Informe anual de Imposto de Renda", "Contratos e demais arquivos enviados pela Empiric"] },
  agenda: { title: "Datas", accent: "importantes", stage: "Etapa 5", features: ["Linha do tempo de repasses, vistorias e fim de contratos"] },
  avisos: { title: "Avisos", accent: "e notícias", stage: "Etapa 5", features: ["Comunicados da Empiric sobre seus imóveis"] },
};

export const TENANT_MODULES: Record<string, Planned> = {
  faturas: { title: "Suas", accent: "faturas", stage: "Etapa 4", features: ["Boletos por competência com valor, vencimento e status", "Detalhamento dos itens da cobrança", "Linha digitável, Pix e download do PDF", "Recibos e histórico de pagamentos"] },
  chamados: { title: "Central de", accent: "manutenção", stage: "Etapa 4", features: ["Abrir chamado com categoria, prioridade e descrição", "Anexar fotos, vídeos e documentos", "Acompanhar etapas e conversar com a Empiric"] },
  documentos: { title: "Contrato", accent: "e vistoria", stage: "Etapa 4", features: ["Contrato assinado para consulta e download", "Laudo de vistoria com anexos"] },
  avisos: { title: "Avisos", accent: "e novidades", stage: "Etapa 4", features: ["Comunicados, novidades e notícias da Empiric"] },
  indique: { title: "Indique", accent: "e Ganhe", stage: "Etapa 4", features: ["Cadastrar indicação com nome e contato", "Acompanhar status da indicação", "Regras e recompensa do programa"] },
};
