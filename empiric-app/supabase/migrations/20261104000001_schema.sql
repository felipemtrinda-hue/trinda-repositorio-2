-- =============================================================================
-- EMPIRIC IMOB — Schema base (Etapa 1 · Fundação)
-- Entidades: perfis, imóveis, vínculos, contratos, documentos, boletos,
-- pagamentos, chamados, comunicados, notificações, indicações, agenda e logs.
-- Toda tabela tem RLS habilitado (ver 20261104000002_rls.sql).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.user_role        as enum ('admin', 'owner', 'tenant');
create type public.account_status   as enum ('invited', 'active', 'blocked');
create type public.property_status  as enum ('available', 'rented', 'reserved', 'maintenance', 'archived');
create type public.property_kind    as enum ('apartment', 'house', 'commercial', 'land', 'other');
create type public.lease_status     as enum ('draft', 'awaiting_signature', 'active', 'ended', 'cancelled');
create type public.document_kind    as enum ('contract', 'inspection', 'invoice', 'receipt', 'statement', 'income_tax', 'personal', 'other');
create type public.invoice_status   as enum ('pending', 'paid', 'overdue', 'cancelled');
create type public.ticket_status    as enum ('new', 'analysis', 'waiting_third_party', 'in_progress', 'done', 'cancelled');
create type public.ticket_priority  as enum ('low', 'medium', 'high', 'urgent');
create type public.audience_kind    as enum ('all', 'role', 'property', 'user');
create type public.notification_channel as enum ('in_app', 'email', 'whatsapp');
create type public.delivery_status  as enum ('queued', 'sent', 'failed', 'skipped_not_configured');
create type public.referral_status  as enum ('received', 'contacting', 'converted', 'not_converted', 'reward_released');
create type public.event_kind       as enum ('invoice_due', 'lease_start', 'lease_end', 'inspection', 'maintenance', 'payout', 'task', 'reminder');

-- -----------------------------------------------------------------------------
-- Utilitário: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          public.user_role not null,
  status        public.account_status not null default 'invited',
  full_name     text not null,
  email         text not null,
  phone         text,
  whatsapp      text,
  document_id   text,              -- CPF/CNPJ
  notes         text,
  lgpd_consent_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.profiles (role);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Cria o perfil quando o admin cria/convida o usuário (via service role).
-- O papel vem de raw_APP_meta_data, que só o backend consegue definir —
-- nunca de raw_user_meta_data, que o próprio usuário controla.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role public.user_role;
begin
  v_role := coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'tenant')::public.user_role;
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    v_role,
    coalesce(new.raw_app_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_app_meta_data ->> 'phone'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Imóveis
-- -----------------------------------------------------------------------------
create table public.properties (
  id            uuid primary key default gen_random_uuid(),
  code          text unique,                 -- código interno da imobiliária
  title         text not null,
  kind          public.property_kind not null default 'apartment',
  status        public.property_status not null default 'available',
  description   text,
  street        text not null,
  number        text,
  complement    text,
  district      text,
  city          text not null,
  state         char(2) not null,
  zip_code      text,
  bedrooms      smallint,
  bathrooms     smallint,
  parking_spots smallint,
  area_m2       numeric(10,2),
  rent_amount   numeric(12,2),
  condo_amount  numeric(12,2),
  iptu_amount   numeric(12,2),
  features      text[] not null default '{}',
  created_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.properties (status);
create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_at();

create table public.property_photos (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties (id) on delete cascade,
  storage_path text not null,             -- bucket "imoveis"
  caption      text,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);
create index on public.property_photos (property_id, position);

-- Vínculo proprietário ↔ imóvel (um imóvel pode ter vários proprietários)
create table public.property_owners (
  property_id  uuid not null references public.properties (id) on delete cascade,
  owner_id     uuid not null references public.profiles (id) on delete restrict,
  share_pct    numeric(5,2) not null default 100 check (share_pct > 0 and share_pct <= 100),
  created_at   timestamptz not null default now(),
  primary key (property_id, owner_id)
);
create index on public.property_owners (owner_id);

-- -----------------------------------------------------------------------------
-- Contratos de locação
-- -----------------------------------------------------------------------------
create table public.leases (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties (id) on delete restrict,
  tenant_id     uuid not null references public.profiles (id) on delete restrict,
  status        public.lease_status not null default 'draft',
  start_date    date not null,
  end_date      date not null,
  due_day       smallint not null default 10 check (due_day between 1 and 31),
  rent_amount   numeric(12,2) not null,
  adjustment_index text,                  -- IGP-M, IPCA...
  renewal_alert_days int not null default 60,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (end_date > start_date)
);
create index on public.leases (tenant_id);
create index on public.leases (property_id);
-- Um imóvel só pode ter um contrato ativo por vez
create unique index leases_one_active_per_property
  on public.leases (property_id) where status = 'active';
create trigger leases_touch before update on public.leases
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Documentos (metadados; arquivo fica no storage privado "documentos")
-- -----------------------------------------------------------------------------
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  kind          public.document_kind not null,
  title         text not null,
  storage_path  text not null unique,
  mime_type     text not null,
  size_bytes    bigint not null check (size_bytes > 0 and size_bytes <= 26214400), -- 25 MB
  property_id   uuid references public.properties (id) on delete set null,
  lease_id      uuid references public.leases (id) on delete set null,
  recipient_id  uuid references public.profiles (id) on delete set null, -- dono do documento
  base_year     smallint,                -- Imposto de Renda: ano-base
  competence    date,                    -- recibos/demonstrativos: 1º dia do mês
  published_at  timestamptz,             -- null = rascunho (invisível ao usuário)
  uploaded_by   uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  check (kind <> 'income_tax' or base_year is not null)
);
create index on public.documents (recipient_id, kind);
create index on public.documents (property_id);
create index on public.documents (lease_id);

-- -----------------------------------------------------------------------------
-- Boletos / faturas
-- -----------------------------------------------------------------------------
create table public.invoices (
  id            uuid primary key default gen_random_uuid(),
  lease_id      uuid not null references public.leases (id) on delete restrict,
  competence    date not null,           -- 1º dia do mês de referência
  due_date      date not null,
  amount        numeric(12,2) not null check (amount >= 0),
  status        public.invoice_status not null default 'pending',
  barcode       text,                    -- linha digitável
  pix_code      text,
  document_id   uuid references public.documents (id) on delete set null, -- PDF do boleto
  paid_at       timestamptz,
  paid_amount   numeric(12,2),
  external_ref  text,                    -- id no gateway de pagamento
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (lease_id, competence)
);
create index on public.invoices (due_date) where status = 'pending';
create trigger invoices_touch before update on public.invoices
  for each row execute function public.touch_updated_at();

create table public.invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices (id) on delete cascade,
  label       text not null,             -- Aluguel, Condomínio, IPTU, Multa...
  amount      numeric(12,2) not null,
  position    int not null default 0
);

-- Pagamentos registrados manualmente ou por webhook do gateway
create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices (id) on delete restrict,
  amount       numeric(12,2) not null check (amount > 0),
  paid_at      timestamptz not null,
  method       text,                     -- boleto, pix, transferência
  source       text not null default 'manual', -- manual | webhook
  external_ref text unique,
  recorded_by  uuid references public.profiles (id),
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Chamados de manutenção
-- -----------------------------------------------------------------------------
create table public.tickets (
  id           uuid primary key default gen_random_uuid(),
  number       bigint generated always as identity unique,
  property_id  uuid not null references public.properties (id) on delete restrict,
  opened_by    uuid not null references public.profiles (id),
  assignee_id  uuid references public.profiles (id),
  category     text not null,            -- hidráulica, elétrica, estrutura...
  title        text not null,
  description  text not null,
  priority     public.ticket_priority not null default 'medium',
  status       public.ticket_status not null default 'new',
  due_date     date,
  closed_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.tickets (status);
create index on public.tickets (opened_by);
create trigger tickets_touch before update on public.tickets
  for each row execute function public.touch_updated_at();

-- Linha do tempo: comentários e mudanças de status
create table public.ticket_events (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets (id) on delete cascade,
  author_id   uuid not null references public.profiles (id),
  message     text,
  from_status public.ticket_status,
  to_status   public.ticket_status,
  internal    boolean not null default false, -- nota interna, invisível ao inquilino
  created_at  timestamptz not null default now()
);
create index on public.ticket_events (ticket_id, created_at);

create table public.ticket_attachments (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references public.tickets (id) on delete cascade,
  event_id     uuid references public.ticket_events (id) on delete set null,
  storage_path text not null unique,     -- bucket "chamados"
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes > 0 and size_bytes <= 52428800), -- 50 MB (vídeo)
  uploaded_by  uuid not null references public.profiles (id),
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Comunicados e notícias
-- -----------------------------------------------------------------------------
create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  is_news       boolean not null default false,
  audience      public.audience_kind not null default 'all',
  target_role   public.user_role,
  target_property_id uuid references public.properties (id) on delete cascade,
  target_user_id     uuid references public.profiles (id) on delete cascade,
  scheduled_for timestamptz,             -- null = imediato
  published_at  timestamptz,
  created_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  check (audience <> 'role'     or target_role is not null),
  check (audience <> 'property' or target_property_id is not null),
  check (audience <> 'user'     or target_user_id is not null)
);

-- -----------------------------------------------------------------------------
-- Notificações (central in-app) + entregas por canal (e-mail/WhatsApp)
-- -----------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null,             -- invoice_available, invoice_due, payment_confirmed, ticket_update...
  title       text not null,
  body        text,
  link        text,
  dedupe_key  text unique,               -- evita duplicidade (ex.: due10:<invoice_id>)
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

create table public.notification_deliveries (
  id              uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  channel         public.notification_channel not null,
  status          public.delivery_status not null default 'queued',
  attempts        int not null default 0,
  last_error      text,
  provider_ref    text,
  next_attempt_at timestamptz not null default now(),
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  unique (notification_id, channel)
);
create index on public.notification_deliveries (status, next_attempt_at);

-- -----------------------------------------------------------------------------
-- Indique e Ganhe
-- -----------------------------------------------------------------------------
create table public.referral_program (
  id           smallint primary key default 1 check (id = 1), -- linha única
  active       boolean not null default false,
  reward_text  text,                      -- ex.: "R$ 200 de desconto no aluguel"
  criteria     text,
  rules        text,
  valid_until  date,
  updated_at   timestamptz not null default now()
);

create table public.referrals (
  id             uuid primary key default gen_random_uuid(),
  referrer_id    uuid not null references public.profiles (id) on delete cascade,
  referred_name  text not null,
  referred_phone text,
  referred_email text,
  notes          text,
  status         public.referral_status not null default 'received',
  reward_validated_by uuid references public.profiles (id),
  reward_validated_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (referred_phone is not null or referred_email is not null),
  -- recompensa só é liberada com validação explícita do admin
  check (status <> 'reward_released' or reward_validated_at is not null)
);
create index on public.referrals (referrer_id);
create trigger referrals_touch before update on public.referrals
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Agenda
-- -----------------------------------------------------------------------------
create table public.calendar_events (
  id           uuid primary key default gen_random_uuid(),
  kind         public.event_kind not null,
  title        text not null,
  description  text,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  all_day      boolean not null default true,
  property_id  uuid references public.properties (id) on delete cascade,
  lease_id     uuid references public.leases (id) on delete cascade,
  ticket_id    uuid references public.tickets (id) on delete cascade,
  assignee_id  uuid references public.profiles (id),
  visible_to_owner  boolean not null default false,
  visible_to_tenant boolean not null default false,
  created_by   uuid references public.profiles (id),
  created_at   timestamptz not null default now()
);
create index on public.calendar_events (starts_at);

-- -----------------------------------------------------------------------------
-- Configurações (chave/valor editável pelo admin) e integrações
-- -----------------------------------------------------------------------------
create table public.settings (
  key        text primary key,
  value      jsonb not null,
  is_public  boolean not null default false, -- legível por qualquer usuário logado
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value, is_public) values
  ('company',          '{"name": "Empiric Negócios Imobiliários", "creci": null, "address": null, "phone": null, "email": null, "site": "https://www.empiricimob.com.br/"}', true),
  ('whatsapp',         '{"number": null, "default_message": "Olá! Sou cliente da Empiric e preciso de ajuda."}', true),
  ('reminders',        '{"invoice_due_days": [10], "timezone": "America/Sao_Paulo"}', false);

-- Credenciais NUNCA ficam aqui: só o estado. Segredos vão em variáveis de
-- ambiente do servidor / Supabase Vault.
create table public.integrations (
  provider    text primary key,          -- email, whatsapp_business, payments, e_signature
  enabled     boolean not null default false,
  configured  boolean not null default false,
  config      jsonb not null default '{}', -- parâmetros não sensíveis (remetente, template id...)
  updated_at  timestamptz not null default now()
);
insert into public.integrations (provider) values
  ('email'), ('whatsapp_business'), ('payments'), ('e_signature');

-- -----------------------------------------------------------------------------
-- Log de atividades (auditoria)
-- -----------------------------------------------------------------------------
create table public.activity_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,             -- login, upload, update, delete, send, status_change
  entity      text not null,
  entity_id   text,
  details     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index on public.activity_logs (created_at desc);
create index on public.activity_logs (entity, entity_id);
