-- =============================================================================
-- EMPIRIC IMOB — Etapas 4 e 5 · chamados, comunicados e Indique e Ganhe
-- =============================================================================

-- Avisa toda a equipe (admins ativos)
create or replace function public.notify_admins(p_type text, p_title text, p_body text, p_link text, p_dedupe text)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.profiles where role = 'admin' and status <> 'blocked' loop
    perform public.notify(r.id, p_type, p_title, p_body, p_link, p_dedupe || ':' || r.id);
  end loop;
end $$;
revoke all on function public.notify_admins(text, text, text, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Chamados
-- -----------------------------------------------------------------------------

-- Novo chamado → equipe avisada + 1º item da linha do tempo
create or replace function public.on_ticket_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_prop text;
begin
  select title into v_prop from public.properties where id = new.property_id;
  insert into public.ticket_events (ticket_id, author_id, message, to_status)
  values (new.id, new.opened_by, 'Chamado aberto.', 'new');
  perform public.notify_admins('ticket_new', format('Novo chamado #%s', new.number),
    format('%s · %s · prioridade %s', v_prop, new.title,
      case new.priority when 'urgent' then 'urgente' when 'high' then 'alta' when 'low' then 'baixa' else 'média' end),
    '/admin/chamados/' || new.id, 'ticket_new:' || new.id);
  return new;
end $$;
create trigger tickets_created after insert on public.tickets
  for each row execute function public.on_ticket_created();

-- Mudança de status → registro na linha do tempo e data de conclusão
create or replace function public.on_ticket_status_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.ticket_events (ticket_id, author_id, from_status, to_status)
    values (new.id, coalesce(auth.uid(), new.assignee_id, new.opened_by), old.status, new.status);
  end if;
  return new;
end $$;
create trigger tickets_status_event after update of status on public.tickets
  for each row execute function public.on_ticket_status_event();

create or replace function public.set_ticket_closed_at()
returns trigger language plpgsql as $$
begin
  if new.status in ('done', 'cancelled') and old.status not in ('done', 'cancelled') then new.closed_at := now();
  elsif new.status not in ('done', 'cancelled') then new.closed_at := null;
  end if;
  return new;
end $$;
create trigger tickets_closed_at before update of status on public.tickets
  for each row execute function public.set_ticket_closed_at();

-- Mensagem no chamado → avisa o outro lado (notas internas não avisam o inquilino)
create or replace function public.on_ticket_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare t public.tickets;
begin
  if new.message is null or new.to_status is not null then return new; end if;
  select * into t from public.tickets where id = new.ticket_id;
  if new.author_id = t.opened_by then
    perform public.notify_admins('ticket_message', format('Nova mensagem no chamado #%s', t.number),
      left(new.message, 140), '/admin/chamados/' || t.id, 'ticket_msg:' || new.id);
  elsif not new.internal then
    perform public.notify(t.opened_by, 'ticket_message', format('A Empiric respondeu o chamado #%s', t.number),
      left(new.message, 140), '/inquilino/chamados/' || t.id, 'ticket_msg:' || new.id);
  end if;
  return new;
end $$;
create trigger ticket_events_message after insert on public.ticket_events
  for each row execute function public.on_ticket_message();

-- -----------------------------------------------------------------------------
-- Comunicados: publicação imediata distribui na hora (agendados: rotina diária)
-- -----------------------------------------------------------------------------
create or replace function public.on_announcement_published()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.published_at is not null and new.published_at <= now()
     and (tg_op = 'INSERT' or old.published_at is null) then
    perform public.fan_out_announcement(new.id);
  end if;
  return new;
end $$;
create trigger announcements_publish after insert or update of published_at on public.announcements
  for each row execute function public.on_announcement_published();

-- -----------------------------------------------------------------------------
-- Indique e Ganhe
-- -----------------------------------------------------------------------------
insert into public.referral_program (id) values (1) on conflict do nothing;

create or replace function public.on_referral_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify_admins('referral_new', 'Nova indicação recebida', new.referred_name,
      '/admin/indicacoes', 'referral_new:' || new.id);
  elsif new.status is distinct from old.status then
    perform public.notify(new.referrer_id, 'referral_update', 'Sua indicação foi atualizada',
      format('%s: %s', new.referred_name, case new.status
        when 'contacting' then 'em contato' when 'converted' then 'convertida! 🎉'
        when 'not_converted' then 'não convertida' when 'reward_released' then 'recompensa liberada'
        else 'recebida' end),
      '/inquilino/indique', 'referral_update:' || new.id || ':' || new.status);
  end if;
  return new;
end $$;
create trigger referrals_notify after insert or update of status on public.referrals
  for each row execute function public.on_referral_change();

-- Recompensa só depois de convertida
create or replace function public.guard_referral_reward()
returns trigger language plpgsql as $$
begin
  if new.status = 'reward_released' and old.status <> 'converted' and old.status <> 'reward_released' then
    raise exception 'A recompensa só pode ser liberada para indicações convertidas.' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger referrals_guard_reward before update of status on public.referrals
  for each row execute function public.guard_referral_reward();
