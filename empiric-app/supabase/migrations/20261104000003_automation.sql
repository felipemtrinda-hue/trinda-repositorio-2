-- =============================================================================
-- EMPIRIC IMOB — Notificações, lembretes de vencimento e auditoria
-- =============================================================================

-- -----------------------------------------------------------------------------
-- notify(): cria a notificação in-app + fila de entrega por e-mail/WhatsApp.
-- dedupe_key impede duplicidade (ex.: o lembrete de 10 dias roda todo dia,
-- mas cada boleto só gera um aviso).
-- As entregas externas ficam "queued"; o worker (/api/cron/deliveries)
-- envia de verdade ou marca "skipped_not_configured" quando a integração
-- ainda não tem credenciais — nada é simulado.
-- -----------------------------------------------------------------------------
create or replace function public.notify(
  p_user uuid, p_type text, p_title text, p_body text default null,
  p_link text default null, p_dedupe text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, link, dedupe_key)
  values (p_user, p_type, p_title, p_body, p_link, p_dedupe)
  on conflict (dedupe_key) do nothing
  returning id into v_id;

  if v_id is not null then
    insert into public.notification_deliveries (notification_id, channel)
    values (v_id, 'email'), (v_id, 'whatsapp');
  end if;
  return v_id;
end $$;
revoke all on function public.notify(uuid, text, text, text, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Gatilhos de notificação
-- -----------------------------------------------------------------------------

-- Boleto publicado / pagamento confirmado
create or replace function public.on_invoice_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid;
begin
  select tenant_id into v_tenant from public.leases where id = new.lease_id;

  if new.published_at is not null and (tg_op = 'INSERT' or old.published_at is null) then
    perform public.notify(v_tenant, 'invoice_available',
      'Novo boleto disponível',
      format('Competência %s · vencimento %s · R$ %s',
        to_char(new.competence, 'MM/YYYY'), to_char(new.due_date, 'DD/MM/YYYY'),
        to_char(new.amount, 'FM999G999G990D00')),
      '/inquilino/faturas', 'invoice_available:' || new.id);
  end if;

  if tg_op = 'UPDATE' and new.status = 'paid' and old.status <> 'paid' then
    perform public.notify(v_tenant, 'payment_confirmed',
      'Pagamento confirmado',
      format('Recebemos o pagamento da competência %s. Obrigado!', to_char(new.competence, 'MM/YYYY')),
      '/inquilino/faturas', 'payment_confirmed:' || new.id);
  end if;
  return new;
end $$;
create trigger invoices_notify after insert or update on public.invoices
  for each row execute function public.on_invoice_change();

-- Documento publicado (recibo, IR, contrato, laudo...)
create or replace function public.on_document_published()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_title text;
begin
  if new.published_at is null or (tg_op = 'UPDATE' and old.published_at is not null) then
    return new;
  end if;

  v_title := case new.kind
    when 'income_tax' then 'Informe de Imposto de Renda disponível'
    when 'receipt'    then 'Novo recibo disponível'
    when 'statement'  then 'Novo demonstrativo disponível'
    when 'contract'   then 'Contrato disponível'
    when 'inspection' then 'Laudo de vistoria disponível'
    else 'Novo documento disponível' end;

  for r in
    select new.recipient_id as uid where new.recipient_id is not null
    union
    select l.tenant_id from public.leases l
      where new.recipient_id is null and l.id = new.lease_id
        and new.kind in ('contract', 'inspection', 'invoice', 'other')
    union
    select po.owner_id from public.property_owners po
      where new.recipient_id is null and po.property_id = new.property_id
        and new.kind in ('receipt', 'statement', 'income_tax', 'contract', 'other')
  loop
    perform public.notify(r.uid, 'document_published', v_title, new.title,
      null, 'document_published:' || new.id || ':' || r.uid);
  end loop;
  return new;
end $$;
create trigger documents_notify after insert or update of published_at on public.documents
  for each row execute function public.on_document_published();

-- Status do chamado alterado
create or replace function public.on_ticket_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    perform public.notify(new.opened_by, 'ticket_update',
      format('Chamado #%s atualizado', new.number),
      format('Novo status: %s', case new.status
        when 'new' then 'Novo' when 'analysis' then 'Em análise'
        when 'waiting_third_party' then 'Aguardando terceiro'
        when 'in_progress' then 'Em andamento' when 'done' then 'Concluído'
        else 'Cancelado' end),
      '/inquilino/chamados/' || new.id,
      'ticket_update:' || new.id || ':' || new.status || ':' || extract(epoch from now())::bigint);
  end if;
  return new;
end $$;
create trigger tickets_notify after update of status on public.tickets
  for each row execute function public.on_ticket_status();

-- -----------------------------------------------------------------------------
-- Rotina diária (fuso America/Sao_Paulo, configurável em settings.reminders)
--  1. marca boletos vencidos
--  2. lembrete N dias antes do vencimento (padrão: 10)
--  3. publica comunicados agendados e distribui notificações
-- -----------------------------------------------------------------------------
create or replace function public.run_daily_jobs()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cfg     jsonb;
  v_tz      text;
  v_today   date;
  v_day     int;
  v_overdue int := 0;
  v_reminded int := 0;
  v_published int := 0;
  r record;
begin
  select value into v_cfg from public.settings where key = 'reminders';
  v_tz    := coalesce(v_cfg ->> 'timezone', 'America/Sao_Paulo');
  v_today := (now() at time zone v_tz)::date;

  update public.invoices set status = 'overdue'
   where status = 'pending' and due_date < v_today;
  get diagnostics v_overdue = row_count;

  for v_day in select jsonb_array_elements_text(coalesce(v_cfg -> 'invoice_due_days', '[10]'))::int loop
    for r in
      select i.id, i.due_date, i.amount, i.competence, l.tenant_id
        from public.invoices i join public.leases l on l.id = i.lease_id
       where i.status = 'pending' and i.published_at is not null
         and i.due_date = v_today + v_day
    loop
      if public.notify(r.tenant_id, 'invoice_due',
           format('Seu boleto vence em %s dias', v_day),
           format('Vencimento %s · R$ %s', to_char(r.due_date, 'DD/MM/YYYY'),
                  to_char(r.amount, 'FM999G999G990D00')),
           '/inquilino/faturas', format('invoice_due:%s:%s', v_day, r.id)) is not null then
        v_reminded := v_reminded + 1;
      end if;
    end loop;
  end loop;

  for r in
    update public.announcements set published_at = now()
     where published_at is null and scheduled_for is not null and scheduled_for <= now()
    returning *
  loop
    perform public.fan_out_announcement(r.id);
    v_published := v_published + 1;
  end loop;

  return jsonb_build_object('date', v_today, 'overdue', v_overdue,
                            'reminders', v_reminded, 'announcements', v_published);
end $$;
revoke all on function public.run_daily_jobs() from public, anon, authenticated;

create or replace function public.fan_out_announcement(p_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  a public.announcements;
  n int := 0;
  r record;
begin
  select * into a from public.announcements where id = p_id;
  if a.published_at is null then return 0; end if;

  for r in
    select p.id from public.profiles p
     where p.status <> 'blocked' and p.role <> 'admin' and (
       a.audience = 'all'
       or (a.audience = 'role' and p.role = a.target_role)
       or (a.audience = 'user' and p.id = a.target_user_id)
       or (a.audience = 'property' and (
             exists (select 1 from public.property_owners po where po.owner_id = p.id and po.property_id = a.target_property_id)
          or exists (select 1 from public.leases l where l.tenant_id = p.id and l.property_id = a.target_property_id
                       and l.status in ('active', 'awaiting_signature'))))
     )
  loop
    perform public.notify(r.id, case when a.is_news then 'news' else 'announcement' end,
      a.title, left(a.body, 160), null, 'announcement:' || a.id || ':' || r.id);
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.fan_out_announcement(uuid) from public, anon, authenticated;

-- Agendamento com pg_cron (habilite a extensão em Database → Extensions).
-- 09:00 UTC = 06:00 em Brasília. A data "hoje" é calculada no fuso configurado.
--   select cron.schedule('empiric-daily', '0 9 * * *', $$select public.run_daily_jobs()$$);

-- -----------------------------------------------------------------------------
-- Auditoria automática de alterações relevantes
-- -----------------------------------------------------------------------------
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_id text;
  v_details jsonb := '{}';
begin
  v_id := coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id'));
  if tg_op = 'UPDATE' and (to_jsonb(new) ? 'status')
     and (to_jsonb(new) ->> 'status') is distinct from (to_jsonb(old) ->> 'status') then
    v_details := jsonb_build_object('from', to_jsonb(old) ->> 'status', 'to', to_jsonb(new) ->> 'status');
  end if;

  insert into public.activity_logs (actor_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    case tg_op
      when 'INSERT' then case when tg_table_name in ('documents', 'ticket_attachments') then 'upload' else 'create' end
      when 'DELETE' then 'delete'
      else case when v_details <> '{}' then 'status_change' else 'update' end
    end,
    tg_table_name, v_id, v_details
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','properties','property_owners','leases','documents','invoices','payments',
    'tickets','ticket_attachments','announcements','referrals','settings','integrations'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row()',
      t || '_audit', t);
  end loop;
end $$;

-- Eventos explícitos vindos do app (login, download, envio)
create or replace function public.log_activity(p_action text, p_entity text, p_entity_id text default null, p_details jsonb default '{}')
returns void language sql security definer set search_path = public as $$
  insert into public.activity_logs (actor_id, action, entity, entity_id, details)
  select public.me(), p_action, p_entity, p_entity_id, coalesce(p_details, '{}')
  where public.me() is not null;
$$;
revoke all on function public.log_activity(text, text, text, jsonb) from public, anon;
grant execute on function public.log_activity(text, text, text, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Visão do dashboard administrativo (agregados em uma consulta)
-- -----------------------------------------------------------------------------
create or replace function public.admin_dashboard_summary()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not public.is_admin() then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'properties', (select jsonb_build_object(
        'total',       count(*) filter (where status <> 'archived'),
        'rented',      count(*) filter (where status = 'rented'),
        'available',   count(*) filter (where status = 'available'),
        'reserved',    count(*) filter (where status = 'reserved'),
        'maintenance', count(*) filter (where status = 'maintenance'))
      from public.properties),
    'leases', (select jsonb_build_object(
        'active',   count(*) filter (where status = 'active'),
        'expiring', count(*) filter (where status = 'active' and end_date <= v_today + renewal_alert_days),
        'ended',    count(*) filter (where status = 'ended'),
        'awaiting_signature', count(*) filter (where status = 'awaiting_signature'))
      from public.leases),
    'invoices', (select jsonb_build_object(
        'issued',   count(*) filter (where status <> 'cancelled'),
        'paid',     count(*) filter (where status = 'paid'),
        'pending',  count(*) filter (where status = 'pending'),
        'overdue',  count(*) filter (where status = 'overdue'),
        'received', coalesce(sum(coalesce(paid_amount, amount)) filter (where status = 'paid'), 0),
        'receivable', coalesce(sum(amount) filter (where status in ('pending', 'overdue')), 0))
      from public.invoices
      where competence >= date_trunc('month', v_today) - interval '11 months'),
    'tickets', (select jsonb_build_object(
        'new',          count(*) filter (where status = 'new'),
        'analysis',     count(*) filter (where status = 'analysis'),
        'waiting_third_party', count(*) filter (where status = 'waiting_third_party'),
        'in_progress',  count(*) filter (where status = 'in_progress'),
        'done',         count(*) filter (where status = 'done'))
      from public.tickets),
    'monthly', (select coalesce(jsonb_agg(m order by m.month), '[]') from (
        select to_char(gs, 'YYYY-MM') as month,
               coalesce(sum(i.amount) filter (where i.status = 'paid'), 0) as received,
               coalesce(sum(i.amount) filter (where i.status in ('pending', 'overdue')), 0) as open
          from generate_series(date_trunc('month', v_today) - interval '5 months',
                               date_trunc('month', v_today), interval '1 month') gs
          left join public.invoices i on date_trunc('month', i.competence) = gs
         group by gs) m)
  );
end $$;
revoke all on function public.admin_dashboard_summary() from public, anon;
grant execute on function public.admin_dashboard_summary() to authenticated;
