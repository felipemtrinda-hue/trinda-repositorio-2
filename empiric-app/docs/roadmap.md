# Roadmap — etapas do prompt de desenvolvimento

Legenda: ✅ pronto · 🟡 parcial · ⬜ a fazer

## Etapa 1 — Fundação ✅ (esta entrega)
- ✅ Proposta de identidade visual (`docs/identidade-visual.md`) e design tokens
- ✅ Next.js 16 + TypeScript + Tailwind 4; Supabase (Postgres, Auth, Storage privado)
- ✅ Schema completo: perfis, imóveis, fotos, vínculos, contratos, documentos, boletos, itens, pagamentos,
  chamados + linha do tempo + anexos, comunicados, notificações + fila de entrega, Indique e Ganhe, agenda,
  configurações, integrações, auditoria
- ✅ RLS em todas as tabelas e no storage — **47 testes** de permissão (`npm run db:test`)
- ✅ Login, recuperação de senha, primeiro acesso com consentimento LGPD, bloqueio de conta
- ✅ Redirecionamento por perfil; layouts admin/proprietário/inquilino; menu recolhível; navegação mobile
- ✅ Dashboards com dados reais (admin via `admin_dashboard_summary`, proprietário, inquilino)
- ✅ Lista de imóveis com busca e filtros; central de notificações
- ✅ Rotina diária (vencidos, lembrete de 10 dias sem duplicar, comunicados agendados) + endpoints de cron
- ✅ Gatilhos de notificação: boleto publicado, pagamento confirmado, documento publicado, status de chamado
- ✅ Estados vazios, skeleton, erro, 404, aviso offline, WhatsApp flutuante

## Etapa 2 — Administração ✅
- ✅ Imóveis: cadastro/edição com busca de CEP (ViaCEP), características, valores, diferenciais; arquivamento com confirmação
- ✅ Fotos: envio direto ao storage privado, validação de tipo/tamanho, URLs assinadas, remoção
- ✅ Vínculo de proprietários com % de participação (soma limitada a 100% no banco)
- ✅ Proprietários e inquilinos: lista com busca, cadastro com validação de CPF/CNPJ e telefone
- ✅ Convite por e-mail com papel em `app_metadata`; link de acesso de uso único para enviar por WhatsApp
- ✅ Bloqueio/desbloqueio (perfil + Auth) com confirmação
- ✅ Contratos: cadastro, vigência, vencimento, reajuste, alerta de renovação; fluxo rascunho → assinatura → ativo → encerrado
- ✅ Regras no banco: contrato ativo marca imóvel como alugado; encerrado devolve para disponível; datas e renovação vão para a agenda
- ✅ Agenda: visões mês/semana/dia, filtros por tipo e imóvel, vencimentos de boletos, eventos manuais com visibilidade para proprietário/inquilino
- ⬜ Upload do contrato assinado e laudo de vistoria → Etapa 3 (módulo de documentos)

## App no celular (PWA) ✅
Manifesto, ícones, service worker seguro (sem dados pessoais em cache), página offline,
convite de instalação para Android e iPhone, áreas seguras do iPhone. Lojas: avaliar Expo depois.

## Etapa 3 — Documentos e financeiro ✅
- ✅ Envio de documentos direto ao storage privado, com pré-visualização, validação de tipo/tamanho no navegador e conferência no servidor
- ✅ Tipos: contrato, laudo de vistoria, recibo, demonstrativo, Imposto de Renda (ano-base), documento pessoal, outro
- ✅ Destino por imóvel, contrato ou pessoa; rascunho ou publicação imediata (com aviso automático)
- ✅ Visualizador de PDF/imagem dentro do app e download por link assinado de 2 minutos; cada acesso entra no histórico
- ✅ Boletos: competência, vencimento pelo contrato, itens (aluguel, condomínio, IPTU, desconto), linha digitável, Pix copia-e-cola, PDF
- ✅ Pagamentos manuais (parciais ou totais) com baixa automática e estorno; boleto pago não pode ter valor alterado
- ✅ Inquilino: faturas em aberto e histórico, detalhamento, copiar Pix/linha digitável, PDF; contrato e vistoria
- ✅ Proprietário: recibos por ano, situação dos aluguéis, biblioteca com o informe de IR
- ⬜ Baixa automática por webhook do banco/gateway → depende do fornecedor (Etapa 6)

## Etapa 4 — Portal do inquilino 🟡
Dashboard, faturas e documentos prontos. Falta: abrir chamado com anexos, timeline, avisos, Indique e Ganhe.

## Etapa 5 — Portal do proprietário 🟡
Dashboard, recibos e biblioteca de documentos prontos. Falta: ficha e galeria do imóvel, linha do tempo, avisos.

## Etapa 6 — Comunicação ⬜
Fila e deduplicação prontas. Falta plugar provedores e a tela de Configurações → Integrações.

## Etapa 7 — Qualidade ⬜
E2E com Playwright por perfil, auditoria de acessibilidade, performance, testes de responsividade.

## Depende de contas/credenciais externas (precisa ser contratado/configurado)
| Integração | Sugestão | Onde configurar |
|---|---|---|
| E-mail transacional | Resend (ou SMTP próprio no Supabase Auth) | `RESEND_API_KEY`, `EMAIL_FROM` |
| WhatsApp Business | Meta Cloud API (templates aprovados) | `WHATSAPP_BUSINESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` |
| Boletos/Pix e baixa automática | Asaas, Iugu, Inter ou banco da imobiliária (webhook) | Etapa 3/6 |
| Assinatura digital | Clicksign, ZapSign ou D4Sign | Etapa 6 |
