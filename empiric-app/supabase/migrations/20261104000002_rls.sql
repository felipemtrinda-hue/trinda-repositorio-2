-- =============================================================================
-- EMPIRIC IMOB — Controle de acesso no banco (RLS)
-- Regra de ouro: a interface só esconde menus; quem decide o que cada perfil
-- vê é o Postgres. Proprietários e inquilinos só enxergam o que é deles.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funções auxiliares (security definer para não recursar em RLS)
-- -----------------------------------------------------------------------------

-- Usuário atual, desde que a conta não esteja bloqueada.
create or replace function public.me()
returns uuid language sql stable security definer set search_path = public as $$
  select p.id from public.profiles p
  where p.id = auth.uid() and p.status <> 'blocked'
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status <> 'blocked'
  )
$$;

create or replace function public.owns_property(p_property uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.property_owners po
    where po.property_id = p_property and po.owner_id = public.me()
  )
$$;

-- Inquilino com contrato vigente (ou aguardando assinatura) no imóvel.
create or replace function public.rents_property(p_property uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.leases l
    where l.property_id = p_property and l.tenant_id = public.me()
      and l.status in ('active', 'awaiting_signature')
  )
$$;

create or replace function public.can_see_property(p_property uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.owns_property(p_property) or public.rents_property(p_property)
$$;

create or replace function public.is_lease_tenant(p_lease uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.leases l where l.id = p_lease and l.tenant_id = public.me())
$$;

create or replace function public.can_see_ticket(p_ticket uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tickets t
    where t.id = p_ticket
      and (public.is_admin() or t.opened_by = public.me() or public.owns_property(t.property_id))
  )
$$;

revoke all on function public.me(), public.is_admin(), public.owns_property(uuid),
  public.rents_property(uuid), public.can_see_property(uuid),
  public.is_lease_tenant(uuid), public.can_see_ticket(uuid) from public, anon;
grant execute on function public.me(), public.is_admin(), public.owns_property(uuid),
  public.rents_property(uuid), public.can_see_property(uuid),
  public.is_lease_tenant(uuid), public.can_see_ticket(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Habilita RLS em tudo
-- -----------------------------------------------------------------------------
alter table public.profiles                enable row level security;
alter table public.properties              enable row level security;
alter table public.property_photos         enable row level security;
alter table public.property_owners         enable row level security;
alter table public.leases                  enable row level security;
alter table public.documents               enable row level security;
alter table public.invoices                enable row level security;
alter table public.invoice_items           enable row level security;
alter table public.payments                enable row level security;
alter table public.tickets                 enable row level security;
alter table public.ticket_events           enable row level security;
alter table public.ticket_attachments      enable row level security;
alter table public.announcements           enable row level security;
alter table public.notifications           enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.referral_program        enable row level security;
alter table public.referrals               enable row level security;
alter table public.calendar_events         enable row level security;
alter table public.settings                enable row level security;
alter table public.integrations            enable row level security;
alter table public.activity_logs           enable row level security;

-- Admin: acesso total a todas as tabelas
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','properties','property_photos','property_owners','leases','documents',
    'invoices','invoice_items','payments','tickets','ticket_events','ticket_attachments',
    'announcements','notifications','notification_deliveries','referral_program','referrals',
    'calendar_events','settings','integrations'
  ] loop
    execute format(
      'create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Log de auditoria: admin só lê; ninguém edita ou apaga pelo cliente.
create policy admin_read on public.activity_logs for select to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Perfis
-- -----------------------------------------------------------------------------
create policy self_read on public.profiles for select to authenticated
  using (id = public.me());
create policy self_update on public.profiles for update to authenticated
  using (id = public.me()) with check (id = public.me());

-- Usuário comum não pode promover a si mesmo nem se desbloquear.
create or replace function public.guard_profile_update()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.role is distinct from old.role
       or (new.status is distinct from old.status
           and not (old.status = 'invited' and new.status = 'active')) -- 1º acesso
       or new.email is distinct from old.email
       or new.document_id is distinct from old.document_id then
      raise exception 'Somente a imobiliária pode alterar papel, status, e-mail ou documento.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- -----------------------------------------------------------------------------
-- Imóveis, fotos, vínculos e contratos
-- -----------------------------------------------------------------------------
create policy related_read on public.properties for select to authenticated
  using (status <> 'archived' and public.can_see_property(id));

create policy related_read on public.property_photos for select to authenticated
  using (public.can_see_property(property_id));

create policy own_link_read on public.property_owners for select to authenticated
  using (owner_id = public.me());

create policy related_read on public.leases for select to authenticated
  using (tenant_id = public.me() or public.owns_property(property_id));

-- -----------------------------------------------------------------------------
-- Documentos: só publicados e só do destinatário certo
--  • recipient_id preenchido → apenas essa pessoa
--  • sem recipient → inquilino do contrato vê contrato/vistoria/boleto;
--    proprietário do imóvel vê recibo/demonstrativo/IR/outros do imóvel
-- -----------------------------------------------------------------------------
create policy recipient_read on public.documents for select to authenticated
  using (
    published_at is not null and published_at <= now()
    and (
      recipient_id = public.me()
      or (
        recipient_id is null and (
          (lease_id is not null and public.is_lease_tenant(lease_id)
             and kind in ('contract', 'inspection', 'invoice', 'other'))
          or (property_id is not null and public.owns_property(property_id)
             and kind in ('receipt', 'statement', 'income_tax', 'contract', 'other'))
        )
      )
    )
  );

-- -----------------------------------------------------------------------------
-- Financeiro
-- -----------------------------------------------------------------------------
create policy related_read on public.invoices for select to authenticated
  using (
    published_at is not null
    and exists (
      select 1 from public.leases l
      where l.id = invoices.lease_id
        and (l.tenant_id = public.me() or public.owns_property(l.property_id))
    )
  );

create policy related_read on public.invoice_items for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id));
  -- a subconsulta já passa pela RLS de invoices

create policy related_read on public.payments for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = payments.invoice_id));

-- -----------------------------------------------------------------------------
-- Chamados de manutenção
-- -----------------------------------------------------------------------------
create policy related_read on public.tickets for select to authenticated
  using (opened_by = public.me() or public.owns_property(property_id));

-- Inquilino abre chamado apenas para o imóvel que aluga, sempre como "novo".
create policy tenant_open on public.tickets for insert to authenticated
  with check (
    opened_by = public.me()
    and public.rents_property(property_id)
    and status = 'new'
    and assignee_id is null
  );

create policy related_read on public.ticket_events for select to authenticated
  using (not internal and public.can_see_ticket(ticket_id));

-- Usuário comum só comenta; mudar status é exclusivo do admin.
create policy participant_comment on public.ticket_events for insert to authenticated
  with check (
    author_id = public.me()
    and not internal
    and from_status is null and to_status is null
    and public.can_see_ticket(ticket_id)
  );

create policy related_read on public.ticket_attachments for select to authenticated
  using (public.can_see_ticket(ticket_id));

create policy participant_upload on public.ticket_attachments for insert to authenticated
  with check (uploaded_by = public.me() and public.can_see_ticket(ticket_id));

-- -----------------------------------------------------------------------------
-- Comunicados
-- -----------------------------------------------------------------------------
create policy audience_read on public.announcements for select to authenticated
  using (
    published_at is not null and published_at <= now()
    and (
      audience = 'all'
      or (audience = 'role' and target_role = (select role from public.profiles where id = public.me()))
      or (audience = 'property' and public.can_see_property(target_property_id))
      or (audience = 'user' and target_user_id = public.me())
    )
  );

-- -----------------------------------------------------------------------------
-- Notificações: cada um vê as suas e só pode marcar como lida
-- -----------------------------------------------------------------------------
create policy own_read on public.notifications for select to authenticated
  using (user_id = public.me());
create policy own_mark_read on public.notifications for update to authenticated
  using (user_id = public.me()) with check (user_id = public.me());
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- -----------------------------------------------------------------------------
-- Indique e Ganhe
-- -----------------------------------------------------------------------------
create policy any_read on public.referral_program for select to authenticated
  using (public.me() is not null);

create policy own_read on public.referrals for select to authenticated
  using (referrer_id = public.me());

create policy tenant_create on public.referrals for insert to authenticated
  with check (
    referrer_id = public.me()
    and status = 'received'
    and reward_validated_at is null
    and (select role from public.profiles where id = public.me()) = 'tenant'
  );

-- -----------------------------------------------------------------------------
-- Agenda
-- -----------------------------------------------------------------------------
create policy related_read on public.calendar_events for select to authenticated
  using (
    property_id is not null and (
      (visible_to_owner and public.owns_property(property_id))
      or (visible_to_tenant and public.rents_property(property_id))
    )
  );

-- -----------------------------------------------------------------------------
-- Configurações públicas (nome da empresa, WhatsApp oficial)
-- -----------------------------------------------------------------------------
create policy public_read on public.settings for select to authenticated
  using (is_public);

-- -----------------------------------------------------------------------------
-- Storage privado
--   documentos/  → contratos, boletos, recibos, laudos, IR (arquivo ↔ documents)
--   chamados/    → <ticket_id>/<arquivo>   (fotos, vídeos e anexos)
--   imoveis/     → <property_id>/<arquivo> (galeria)
-- Downloads saem sempre por URL assinada de curta duração gerada no servidor.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('documentos', 'documentos', false, 26214400,
     array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('chamados',   'chamados',   false, 52428800,
     array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'application/pdf']),
  ('imoveis',    'imoveis',    false, 10485760,
     array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy empiric_admin_all on storage.objects for all to authenticated
  using (bucket_id in ('documentos', 'chamados', 'imoveis') and public.is_admin())
  with check (bucket_id in ('documentos', 'chamados', 'imoveis') and public.is_admin());

-- Leitura do arquivo herda a RLS da linha de metadados correspondente.
create policy empiric_documents_read on storage.objects for select to authenticated
  using (bucket_id = 'documentos'
         and exists (select 1 from public.documents d where d.storage_path = storage.objects.name));

create policy empiric_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'imoveis'
         and exists (select 1 from public.property_photos p where p.storage_path = storage.objects.name));

create policy empiric_tickets_read on storage.objects for select to authenticated
  using (bucket_id = 'chamados'
         and exists (select 1 from public.ticket_attachments a where a.storage_path = storage.objects.name));

create policy empiric_tickets_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chamados'
    and exists (
      select 1 from public.tickets t
      where t.id::text = (storage.foldername(storage.objects.name))[1]
        and public.can_see_ticket(t.id)
    )
  );
