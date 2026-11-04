# Roadmap — etapas do prompt de desenvolvimento

Legenda: ✅ pronto · 🟡 parcial · ⬜ a fazer

## Etapa 1 — Fundação ✅ (esta entrega)
- ✅ Proposta de identidade visual (`docs/identidade-visual.md`) e design tokens
- ✅ Next.js 16 + TypeScript + Tailwind 4; Supabase (Postgres, Auth, Storage privado)
- ✅ Schema completo: perfis, imóveis, fotos, vínculos, contratos, documentos, boletos, itens, pagamentos,
  chamados + linha do tempo + anexos, comunicados, notificações + fila de entrega, Indique e Ganhe, agenda,
  configurações, integrações, auditoria
- ✅ RLS em todas as tabelas e no storage — **40+ testes** de permissão (`npm run db:test`)
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

## Etapa 3 — Documentos e financeiro ⬜
Upload com pré-visualização, progresso e validação (tipo/tamanho já limitados no bucket); visualizador PDF/imagem;
URLs assinadas de curta duração; boletos com itens; registro de pagamento; recibos e IR por ano-base.

## Etapa 4 — Portal do inquilino 🟡
Dashboard pronto. Falta: faturas com download, abrir chamado com anexos, timeline, contrato/vistoria, Indique e Ganhe.

## Etapa 5 — Portal do proprietário 🟡
Dashboard pronto. Falta: ficha e galeria do imóvel, recibos por competência, biblioteca de documentos, linha do tempo.

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
