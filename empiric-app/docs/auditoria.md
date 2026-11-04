# Relatório de auditoria — novembro de 2026

Auditoria feita conforme o *Prompt de Auditoria Completa* (fases 1 a 5). Nada foi declarado
testado sem verificação; o método de cada teste está indicado.

## Como foi testado

| O quê | Como | Resultado |
|---|---|---|
| Permissões, isolamento de dados, regras financeiras, notificações | 55 testes em Postgres 16 real com as migrações (`npm run db:test`) | 55/55 passando |
| Telas reais do app (3 perfis × 4 tamanhos, 34 rotas) | Navegador automatizado contra backend simulado com dados fictícios (`tools/auditoria`) | Sem tela de erro, sem erro de console, sem rolagem lateral |
| Fluxos completos dos portais | Protótipo navegável, navegador automatizado | 20 fluxos verificados |
| Tipos, lint e build | `npm run typecheck`, `npm run lint`, `npm run build` | Sem erros |

**Limite honesto:** o backend completo do Supabase (login, storage) não pôde ser executado neste
ambiente (imagens Docker e binários bloqueados pela rede). Upload/download reais de arquivo,
envio de convite por e-mail e login com senha precisam ser testados no projeto Supabase da Empiric.

## 1. Problemas identificados e corrigidos

| # | Gravidade | Problema | Correção |
|---|---|---|---|
| 1 | Alto | Formulário "Lançar boleto" estourava a largura no celular (+96px) | Linha de itens com colunas flexíveis |
| 2 | Alto | Filtros da Agenda estouravam no celular (+58px) | Filtros quebram linha e ocupam a largura |
| 3 | Alto | "Vincular proprietário" saía do card e espremia o seletor | Formulário empilhado na coluna lateral |
| 4 | Alto | Aviso de documento publicado sem link (ia para "#") | Link certo por perfil (biblioteca/recibos/contrato) — testado no banco |
| 5 | Médio · segurança | Anexo de chamado podia apontar para arquivo de outro chamado | Política exige a pasta do próprio chamado — testado |
| 6 | Médio · segurança | App podia registrar ações arbitrárias na auditoria | Só ações conhecidas e tamanho limitado — testado |
| 7 | Médio · segurança | Ação de bloqueio aceitava conta da equipe | Bloqueio restrito a proprietários e inquilinos |
| 8 | Médio | Notificação não era marcada como lida ao abrir | Abrir marca como lida e leva ao destino (só caminhos internos) |
| 9 | Médio | Alvos de toque de 20–36px em 46 telas (celular/tablet) | Mínimo de 44px em telas de toque |
| 10 | Médio | Menu lateral escondia itens em notebooks de tela baixa | Cartão do usuário some em alturas < 820px |
| 11 | Médio | Telefones, CPF e valores apareciam crus ("42999000101", "1850") | Formatação brasileira em telas e formulários |
| 12 | Médio | Títulos de documentos truncados no celular | Título em até 2 linhas, botões só com ícone |
| 13 | Baixo | Valores grandes podiam estourar o card de indicador | Tamanho da fonte se ajusta à largura do card |
| 14 | Baixo | Diálogo de confirmação sem rótulo acessível | `aria-labelledby` no título |

### Protótipo

| Gravidade | Problema | Correção |
|---|---|---|
| Alto | Botões "Semana/Dia" da Agenda eram só decorativos | Visões Mês e Lista funcionais (Lista é padrão no celular) |
| Alto | "Novo imóvel", "Lançar boleto", "Novo cadastro", "Adicionar fotos" só mostravam aviso | Formulários funcionais com validação |
| Médio | Números fixos no painel ("1 perto do vencimento", repasse) | Calculados a partir dos dados |
| Médio | Tablet usava layout de celular | Menu lateral compacto entre 600 e 960px |
| Médio | Anexo de chamado aparecia como ícone vazio | Miniaturas |
| Baixo | Item de menu quebrava em 2 linhas | "Clientes" |
| Baixo | Diálogos sem animação | Entrada suave (respeita "reduzir movimento") |

## 2. Exceções aceitas
- Caixas de marcar com 20px: o rótulo inteiro (44px) é tocável.
- Dias do calendário com 36px: grade densa; a visão Lista atende o celular.

## 3. Funcionalidades verificadas (protótipo)
Abrir chamado com foto → aparece na fila da equipe → mudança de etapa → resposta → inquilino
avisado · registrar pagamento → boleto pago → inquilino avisado · lançar boleto → inquilino
avisado · boleto duplicado bloqueado · comunicado chega aos destinatários · indicação chega à
equipe · cadastro de imóvel e edição persistidos · novo cadastro de pessoa · foto enviada pela
equipe aparece ao proprietário · evento na agenda · formulário vazio não envia · visualizador
de documentos · layouts de celular, tablet e computador.

## 4. Depende de configuração externa
Projeto Supabase (login, storage, SMTP para convites), domínio e hospedagem, e-mail transacional,
WhatsApp Business API, emissor de boletos/Pix com webhook, assinatura digital.

## 5. Atenção futura
- Telas reais da Etapa 4 (chamados, comunicados, Indique e Ganhe) e ficha do imóvel para o proprietário
  ainda estão como "em construção" no app; regras de banco prontas e testadas.
- Política de segurança de conteúdo (CSP) estrita após definir domínios finais.
- Testes ponta a ponta com o Supabase real, nos três perfis, antes de liberar aos clientes.
