-- =============================================================================
-- EMPIRIC IMOB — Etapa 2 · regras de negócio da administração
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Papel sincronizado com app_metadata
--    O convite (auth.admin.inviteUserByEmail) cria o usuário antes de o backend
--    definir o papel. Quando o backend grava app_metadata.role, o perfil segue.
-- -----------------------------------------------------------------------------
create or replace function public.sync_profile_from_auth()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_app_meta_data is distinct from old.raw_app_meta_data then
    update public.profiles set
      role      = coalesce(nullif(new.raw_app_meta_data ->> 'role', '')::public.user_role, role),
      full_name = coalesce(nullif(new.raw_app_meta_data ->> 'full_name', ''), full_name)
    where id = new.id;
  end if;
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.sync_profile_from_auth();

-- -----------------------------------------------------------------------------
-- 2. Contrato ↔ situação do imóvel
--    ativo           → imóvel "alugado"
--    encerrado/cancel → imóvel volta a "disponível" (se não houver outro ativo)
-- -----------------------------------------------------------------------------
create or replace function public.on_lease_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' then
    update public.properties set status = 'rented'
     where id = new.property_id and status <> 'rented';
  elsif tg_op = 'UPDATE' and old.status = 'active' and new.status in ('ended', 'cancelled') then
    update public.properties set status = 'available'
     where id = new.property_id and status = 'rented'
       and not exists (select 1 from public.leases l
                        where l.property_id = new.property_id and l.status = 'active' and l.id <> new.id);
  end if;
  return new;
end $$;

create trigger leases_property_status
  after insert or update of status on public.leases
  for each row execute function public.on_lease_status();

-- -----------------------------------------------------------------------------
-- 3. Contrato → agenda (início, fim e alerta de renovação)
--    Recriados sempre que datas/status mudam; visíveis a proprietário e inquilino.
-- -----------------------------------------------------------------------------
create or replace function public.sync_lease_events()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
begin
  delete from public.calendar_events
   where lease_id = new.id and kind in ('lease_start', 'lease_end', 'reminder')
     and created_by is null;

  if new.status in ('cancelled') then
    return new;
  end if;

  select title into v_title from public.properties where id = new.property_id;

  insert into public.calendar_events
    (kind, title, starts_at, all_day, property_id, lease_id, visible_to_owner, visible_to_tenant)
  values
    ('lease_start', 'Início do contrato · ' || v_title, new.start_date::timestamp at time zone 'America/Sao_Paulo',
       true, new.property_id, new.id, true, true),
    ('lease_end', 'Fim do contrato · ' || v_title, new.end_date::timestamp at time zone 'America/Sao_Paulo',
       true, new.property_id, new.id, true, true);

  if new.status = 'active' and new.renewal_alert_days > 0 then
    insert into public.calendar_events
      (kind, title, description, starts_at, all_day, property_id, lease_id)
    values
      ('reminder', 'Renovação de contrato · ' || v_title,
       format('Contrato termina em %s dias (%s).', new.renewal_alert_days, to_char(new.end_date, 'DD/MM/YYYY')),
       (new.end_date - new.renewal_alert_days)::timestamp at time zone 'America/Sao_Paulo',
       true, new.property_id, new.id);
  end if;
  return new;
end $$;

create trigger leases_calendar
  after insert or update of start_date, end_date, status, renewal_alert_days, property_id on public.leases
  for each row execute function public.sync_lease_events();

-- -----------------------------------------------------------------------------
-- 4. Vincular proprietário só a perfis de proprietário; contrato só a inquilino
-- -----------------------------------------------------------------------------
create or replace function public.check_link_roles()
returns trigger language plpgsql as $$
declare
  v_role public.user_role;
begin
  if tg_table_name = 'property_owners' then
    select role into v_role from public.profiles where id = new.owner_id;
    if v_role <> 'owner' then
      raise exception 'Somente proprietários podem ser vinculados a um imóvel.' using errcode = '23514';
    end if;
  else
    select role into v_role from public.profiles where id = new.tenant_id;
    if v_role <> 'tenant' then
      raise exception 'O contrato precisa ser de um inquilino.' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;

create trigger property_owners_role before insert or update on public.property_owners
  for each row execute function public.check_link_roles();
create trigger leases_role before insert or update of tenant_id on public.leases
  for each row execute function public.check_link_roles();

-- Soma das participações de um imóvel não passa de 100%
create or replace function public.check_owner_shares()
returns trigger language plpgsql as $$
begin
  if (select sum(share_pct) from public.property_owners where property_id = new.property_id) > 100 then
    raise exception 'A soma das participações dos proprietários passa de 100%%.' using errcode = '23514';
  end if;
  return new;
end $$;
create constraint trigger property_owners_shares after insert or update on public.property_owners
  deferrable initially deferred
  for each row execute function public.check_owner_shares();
