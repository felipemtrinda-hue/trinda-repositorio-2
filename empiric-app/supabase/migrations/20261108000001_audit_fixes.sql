-- =============================================================================
-- EMPIRIC IMOB — Correções da auditoria
-- =============================================================================

-- [Médio · segurança] Anexo de chamado só pode apontar para a pasta do próprio
-- chamado no storage (impede vincular arquivo de outro chamado).
drop policy if exists participant_upload on public.ticket_attachments;
create policy participant_upload on public.ticket_attachments for insert to authenticated
  with check (
    uploaded_by = public.me()
    and public.can_see_ticket(ticket_id)
    and storage_path like ticket_id::text || '/%'
    and storage_path not like '%..%'
  );

-- [Baixo · segurança] Registro de atividade pelo app aceita só ações conhecidas
-- e limita o tamanho dos detalhes (evita poluir a auditoria).
create or replace function public.log_activity(p_action text, p_entity text, p_entity_id text default null, p_details jsonb default '{}')
returns void language sql security definer set search_path = public as $$
  insert into public.activity_logs (actor_id, action, entity, entity_id, details)
  select public.me(), p_action, left(p_entity, 40), left(p_entity_id, 64), coalesce(p_details, '{}')
  where public.me() is not null
    and p_action in ('login', 'view', 'download', 'send')
    and pg_column_size(coalesce(p_details, '{}')) < 2048;
$$;

-- [Alto · UX] Aviso de documento publicado agora leva à tela certa de cada perfil.
create or replace function public.on_document_published()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_title text;
  v_role public.user_role;
  v_link text;
begin
  if new.published_at is null or (tg_op = 'UPDATE' and old.published_at is not null) then
    return new;
  end if;
  if new.kind = 'invoice' then
    return new; -- o boleto já avisa pelo gatilho de faturas
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
        and new.kind in ('contract', 'inspection', 'other')
    union
    select po.owner_id from public.property_owners po
      where new.recipient_id is null and po.property_id = new.property_id
        and new.kind in ('receipt', 'statement', 'income_tax', 'contract', 'other')
  loop
    select role into v_role from public.profiles where id = r.uid;
    v_link := case
      when v_role = 'owner' and new.kind in ('receipt', 'statement') then '/proprietario/financeiro'
      when v_role = 'owner' then '/proprietario/documentos'
      else '/inquilino/documentos' end;
    perform public.notify(r.uid, 'document_published', v_title, new.title,
      v_link, 'document_published:' || new.id || ':' || r.uid);
  end loop;
  return new;
end $$;
