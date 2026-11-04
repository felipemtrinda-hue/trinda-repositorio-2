# Empiric Imob — Portal de gestão imobiliária

Plataforma web responsiva (com experiência de app no celular) para a **Empiric Negócios Imobiliários**:
painel administrativo, área do proprietário e área do inquilino.

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage)
- **Segurança:** permissões aplicadas no banco (Row Level Security), não só na interface
- **Status:** Etapa 1 (Fundação) concluída — ver [`docs/roadmap.md`](docs/roadmap.md)
- **Identidade visual:** [`docs/identidade-visual.md`](docs/identidade-visual.md)

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase
npm run dev                  # http://localhost:3000
```

Sem as variáveis do Supabase o app abre normalmente e a tela de login mostra "Configuração pendente".

## Banco de dados (Supabase)

1. Crie um projeto em supabase.com (região São Paulo).
2. Aplique as migrações em ordem — pelo SQL Editor ou pela CLI (`supabase link` + `supabase db push`):
   - `supabase/migrations/20261104000001_schema.sql` — tabelas
   - `supabase/migrations/20261104000002_rls.sql` — permissões e buckets privados
   - `supabase/migrations/20261104000003_automation.sql` — notificações, rotina diária, auditoria
   - `supabase/migrations/20261105000001_admin_rules.sql` — regras de contratos, agenda e vínculos
   - `supabase/migrations/20261106000001_finance.sql` — baixa automática de pagamentos
3. **Authentication → Providers → Email:** desative "Allow new users to sign up" (só a imobiliária cria contas).
4. **Authentication → Email Templates** — troque os links para o fluxo do servidor:
   - Invite: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/redefinir-senha`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha`
5. **URL Configuration:** Site URL = URL de produção; adicione `http://localhost:3000/**` em Redirect URLs.
6. **Primeiro administrador:** em Authentication → Users → *Invite user*, convide o e-mail e depois rode:
   ```sql
   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'voce@empiric...';
   update public.profiles set role = 'admin' where email = 'voce@empiric...';
   ```
   Os demais usuários serão convidados pelo próprio painel (Etapa 2). O papel fica em `app_metadata`,
   que o usuário não consegue alterar.
7. **E-mail de convite:** o SMTP padrão do Supabase envia poucos e-mails por hora. Para produção configure um SMTP
   próprio em Authentication → SMTP Settings (ex.: Resend). Enquanto isso, o admin pode usar
   **"Gerar link de acesso"** na ficha da pessoa e enviar o link pelo WhatsApp.
8. **Configurações iniciais** (até a tela existir): `update public.settings set value = jsonb_set(value, '{number}', '"5542XXXXXXXXX"') where key = 'whatsapp';`

### Testes de permissão

```bash
npm run db:test
```

Sobe um Postgres temporário, aplica as migrações sobre um stub do Supabase e verifica, por perfil, que
inquilinos e proprietários só veem os próprios dados (imóveis, boletos, documentos, arquivos do storage,
chamados, indicações), que ninguém se promove a admin, que contas bloqueadas perdem acesso e que o
lembrete de 10 dias não duplica. Requer `postgresql` instalado localmente.

## Rotinas agendadas

| Endpoint | Função | Agenda (`vercel.json`) |
|---|---|---|
| `/api/cron/daily` | Marca vencidos, envia lembrete de vencimento (padrão 10 dias), publica comunicados agendados | 09:00 UTC (06:00 Brasília) |
| `/api/cron/deliveries` | Processa a fila de e-mail/WhatsApp | a cada 30 min |

Ambos exigem `Authorization: Bearer $CRON_SECRET`. O fuso e os dias de antecedência ficam em
`settings.reminders`. No plano Hobby da Vercel só há crons diários — use o plano Pro ou agende via
`pg_cron` no Supabase (comando comentado na migração 3).

## Integrações externas

Nada é simulado. Sem credenciais, as entregas de e-mail/WhatsApp ficam registradas como
`skipped_not_configured` e continuam visíveis na central de notificações do app. Fornecedores
sugeridos e variáveis em [`docs/roadmap.md`](docs/roadmap.md#depende-de-contascredenciais-externas-precisa-ser-contratadoconfigurado).

## Estrutura

```
src/
  app/(auth)/        login, recuperar-senha, redefinir-senha (1º acesso)
  app/admin/         painel administrativo
  app/proprietario/  área do proprietário
  app/inquilino/     área do inquilino
  app/api/cron/      rotinas agendadas
  components/        ui/ (design system), shell/ (menus), modules/, charts/
  lib/               supabase/ (clientes), auth, formatação, rótulos
  proxy.ts           renovação de sessão e proteção de rotas
supabase/
  migrations/        schema, RLS, automações
  tests/             testes de permissão em Postgres real
```

## App no celular (PWA)

O portal é instalável como aplicativo em iPhone e Android, sem loja:

- **Android (Chrome):** aparece o convite "Instale o app Empiric" com botão **Instalar**.
- **iPhone (Safari):** o convite explica: Compartilhar → **Adicionar à Tela de Início**.
- Abre em tela cheia, com ícone próprio, respeitando o notch e a barra inferior do iPhone.
- Sem internet, mostra uma tela de aviso. Por segurança, **nenhum dado pessoal fica salvo no aparelho**:
  o service worker (`public/sw.js`) guarda só arquivos estáticos (código, logo, ícones).
- Atalhos no ícone (Android): "Minhas faturas" e "Abrir chamado".
- Requer HTTPS (a Vercel já fornece). O service worker só é ativado no build de produção.

Ao alterar `public/sw.js`, troque a constante `VERSION` para os aparelhos baixarem a versão nova.
Publicar nas lojas (App Store/Google Play) fica para depois, se necessário, empacotando este mesmo app com Expo.

## Deploy (Vercel)

Importe o repositório com **Root Directory = `empiric-app`**, configure as variáveis do `.env.example`
(a `SUPABASE_SECRET_KEY` apenas como variável de servidor) e faça o deploy.
