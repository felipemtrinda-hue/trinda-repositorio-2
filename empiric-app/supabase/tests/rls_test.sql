-- Testes de permissão por perfil. Rodar com: npm run db:test
\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = warning;

-- ---------- dados de teste (superusuário) ----------
insert into auth.users (id, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@teste.local',  '{"role":"admin","full_name":"Admin"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'dono1@teste.local',  '{"role":"owner","full_name":"Dono 1"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'dono2@teste.local',  '{"role":"owner","full_name":"Dono 2"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'inq1@teste.local',   '{"role":"tenant","full_name":"Inquilino 1"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'inq2@teste.local',   '{"role":"tenant","full_name":"Inquilino 2"}'),
  ('00000000-0000-0000-0000-0000000000d1', 'hacker@teste.local', '{}');
update public.profiles set status = 'active';

insert into public.properties (id, title, street, city, state, status) values
  ('10000000-0000-0000-0000-000000000001', 'Apto A', 'Rua 1', 'Ponta Grossa', 'PR', 'rented'),
  ('10000000-0000-0000-0000-000000000002', 'Casa B', 'Rua 2', 'Ponta Grossa', 'PR', 'rented');
insert into public.property_owners values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 100, now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000b2', 100, now());
insert into public.leases (id, property_id, tenant_id, status, start_date, end_date, rent_amount) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1', 'active', '2026-01-01', '2027-01-01', 1800),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000c2', 'active', '2026-01-01', '2027-01-01', 2500);

insert into public.invoices (lease_id, competence, due_date, amount, published_at) values
  ('20000000-0000-0000-0000-000000000001', date_trunc('month', current_date), (now() at time zone 'America/Sao_Paulo')::date + 10, 1800, now()),
  ('20000000-0000-0000-0000-000000000002', date_trunc('month', current_date), (now() at time zone 'America/Sao_Paulo')::date + 10, 2500, now()),
  ('20000000-0000-0000-0000-000000000001', date_trunc('month', current_date) - interval '1 month', current_date - 3, 1800, now());

insert into public.documents (kind, title, storage_path, mime_type, size_bytes, property_id, lease_id, base_year, published_at) values
  ('contract',   'Contrato A',   'contratos/a.pdf', 'application/pdf', 1000, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', null, now()),
  ('income_tax', 'IR 2025 A',    'ir/a-2025.pdf',   'application/pdf', 1000, '10000000-0000-0000-0000-000000000001', null, 2025, now()),
  ('income_tax', 'IR 2025 B',    'ir/b-2025.pdf',   'application/pdf', 1000, '10000000-0000-0000-0000-000000000002', null, 2025, now()),
  ('receipt',    'Rascunho A',   'recibos/a-draft.pdf', 'application/pdf', 1000, '10000000-0000-0000-0000-000000000001', null, null, null);
insert into storage.objects (bucket_id, name) select 'documentos', storage_path from public.documents;

create or replace function pg_temp.as_user(uid text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', uid, true), set_config('role', 'authenticated', true)
$$;
create or replace function pg_temp.check(cond boolean, label text) returns void language plpgsql as $$
begin
  if not cond then raise exception 'FALHOU: %', label; end if;
  raise notice 'ok  %', label;
end $$;
set client_min_messages = notice;

-- ---------- papel vem de app_meta_data, nunca de user_meta_data ----------
select pg_temp.check((select role from public.profiles where email = 'hacker@teste.local') = 'tenant',
  'cadastro sem papel definido vira inquilino (sem auto-promoção)');

-- ---------- inquilino 1 ----------
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
select pg_temp.check((select count(*) from public.properties) = 1, 'inquilino vê só o imóvel que aluga');
select pg_temp.check((select count(*) from public.invoices) = 2, 'inquilino vê só os próprios boletos');
select pg_temp.check((select count(*) from public.documents) = 1, 'inquilino vê contrato, não o IR do proprietário');
select pg_temp.check((select count(*) from storage.objects) = 1, 'storage: inquilino só acessa o arquivo do seu contrato');
select pg_temp.check((select count(*) from public.profiles) = 1, 'inquilino não lista outros usuários');
select pg_temp.check((select count(*) from public.activity_logs) = 0, 'inquilino não lê auditoria');
insert into public.tickets (property_id, opened_by, category, title, description)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1', 'hidráulica', 'Vazamento', 'Pia da cozinha');
select pg_temp.check((select count(*) from public.tickets) = 1, 'inquilino abre chamado do próprio imóvel');
insert into public.referrals (referrer_id, referred_name, referred_phone)
  values ('00000000-0000-0000-0000-0000000000c1', 'Amigo', '42999999999');
select pg_temp.check((select count(*) from public.referrals) = 1, 'inquilino registra indicação');
update public.notifications set read_at = now();
select pg_temp.check((select count(*) from public.notifications where read_at is not null) >= 1, 'inquilino marca notificações como lidas');
commit;

do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  begin
    insert into public.tickets (property_id, opened_by, category, title, description)
      values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000c1', 'x', 'x', 'x');
    raise exception 'FALHOU: abriu chamado em imóvel alheio';
  exception when insufficient_privilege then raise notice 'ok  chamado em imóvel alheio bloqueado';
  end;
  begin
    update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000c1';
    raise exception 'FALHOU: inquilino se promoveu a admin';
  exception when insufficient_privilege then raise notice 'ok  auto-promoção a admin bloqueada';
  end;
  begin
    insert into public.referrals (referrer_id, referred_name, referred_phone, status, reward_validated_at)
      values ('00000000-0000-0000-0000-0000000000c1', 'X', '1', 'reward_released', now());
    raise exception 'FALHOU: inquilino liberou a própria recompensa';
  exception when insufficient_privilege then raise notice 'ok  recompensa não é liberada pelo inquilino';
  end;
  begin
    update public.notifications set title = 'x';
    raise exception 'FALHOU: inquilino editou notificação';
  exception when insufficient_privilege then raise notice 'ok  inquilino só altera read_at';
  end;
  perform set_config('role', 'postgres', true);
end $$;
reset role;

-- ---------- primeiro acesso: convidado ativa a própria conta ----------
update public.profiles set status = 'invited' where email = 'inq2@teste.local';
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2');
update public.profiles set status = 'active', lgpd_consent_at = now() where id = '00000000-0000-0000-0000-0000000000c2';
select pg_temp.check((select status from public.profiles where id = '00000000-0000-0000-0000-0000000000c2') = 'active',
  'primeiro acesso: convidado ativa a conta e registra consentimento LGPD');
commit;

-- ---------- inquilino 2 não vê nada do inquilino 1 ----------
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2');
select pg_temp.check((select count(*) from public.tickets) = 0, 'inquilino 2 não vê chamado do inquilino 1');
select pg_temp.check((select count(*) from public.referrals) = 0, 'inquilino 2 não vê indicações alheias');
select pg_temp.check((select count(*) from public.invoices) = 1, 'inquilino 2 vê só o seu boleto');
commit;

-- ---------- proprietário 1 ----------
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select pg_temp.check((select count(*) from public.properties) = 1, 'proprietário vê só o próprio imóvel');
select pg_temp.check((select count(*) from public.documents where kind = 'income_tax') = 1, 'proprietário vê o próprio IR, não o de outro');
select pg_temp.check((select count(*) from public.documents where published_at is null) = 0, 'rascunhos ficam invisíveis');
select pg_temp.check((select count(*) from public.tickets) = 1, 'proprietário acompanha chamados do seu imóvel');
commit;

-- ---------- conta bloqueada perde acesso ----------
update public.profiles set status = 'blocked' where email = 'dono1@teste.local';
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select pg_temp.check((select count(*) from public.properties) = 0, 'conta bloqueada não vê mais nada');
commit;
update public.profiles set status = 'active' where email = 'dono1@teste.local';

-- ---------- admin ----------
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select pg_temp.check((select count(*) from public.documents) = 4, 'admin vê todos os documentos, inclusive rascunhos');
select pg_temp.check((select (public.admin_dashboard_summary() -> 'properties' ->> 'rented')::int) = 2, 'dashboard agrega imóveis');
commit;

do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  begin
    perform public.admin_dashboard_summary();
    raise exception 'FALHOU: inquilino acessou dashboard admin';
  exception when insufficient_privilege then raise notice 'ok  dashboard admin negado ao inquilino';
  end;
  perform set_config('role', 'postgres', true);
end $$;
reset role;

-- ---------- rotina diária: lembrete de 10 dias sem duplicar ----------
select public.run_daily_jobs();
select public.run_daily_jobs();
select pg_temp.check((select count(*) from public.notifications where type = 'invoice_due') = 2,
  'lembrete de 10 dias: 1 por boleto, sem duplicar ao rodar 2x');
select pg_temp.check((select count(*) from public.invoices where status = 'overdue') = 1, 'boleto vencido marcado como overdue');
select pg_temp.check((select count(*) from public.notification_deliveries) =
  2 * (select count(*) from public.notifications), 'cada notificação gera fila de e-mail e WhatsApp');
select pg_temp.check((select count(*) from public.activity_logs where action = 'upload') = 4, 'uploads registrados na auditoria');


-- ---------- Etapa 2: regras de administração ----------
select pg_temp.check((select count(*) from public.calendar_events
  where lease_id = '20000000-0000-0000-0000-000000000001') = 3,
  'contrato gera início, fim e lembrete de renovação na agenda');
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
select pg_temp.check((select count(*) from public.calendar_events) = 2,
  'inquilino vê início/fim do próprio contrato, não o lembrete interno');
commit;

update auth.users set raw_app_meta_data = '{"role":"owner","full_name":"Novo Dono"}'
 where email = 'hacker@teste.local';
select pg_temp.check((select role from public.profiles where email = 'hacker@teste.local') = 'owner',
  'papel definido pelo backend (app_metadata) sincroniza o perfil');

update public.leases set status = 'ended' where id = '20000000-0000-0000-0000-000000000002';
select pg_temp.check((select status from public.properties where id = '10000000-0000-0000-0000-000000000002') = 'available',
  'contrato encerrado devolve o imóvel para disponível');
update public.leases set status = 'active' where id = '20000000-0000-0000-0000-000000000002';
select pg_temp.check((select status from public.properties where id = '10000000-0000-0000-0000-000000000002') = 'rented',
  'contrato ativo marca o imóvel como alugado');

do $$ begin
  begin
    insert into public.property_owners (property_id, owner_id)
      values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1');
    raise exception 'FALHOU: inquilino vinculado como proprietário';
  exception when check_violation then raise notice 'ok  só proprietários podem ser vinculados a imóveis';
  end;
end $$;

do $$ begin
  begin
    insert into public.property_owners (property_id, owner_id, share_pct)
      values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d1', 50);
    set constraints all immediate;
    raise exception 'FALHOU: participações somaram mais de 100%%';
  exception when check_violation then raise notice 'ok  soma das participações limitada a 100%%';
  end;
end $$;


-- ---------- Etapa 3: financeiro ----------
insert into public.payments (invoice_id, amount, paid_at, method)
select id, 1000, now(), 'pix' from public.invoices
 where lease_id = '20000000-0000-0000-0000-000000000002' and status = 'pending' limit 1;
select pg_temp.check((select status from public.invoices where lease_id = '20000000-0000-0000-0000-000000000002' and competence = date_trunc('month', current_date)) = 'pending',
  'pagamento parcial mantém o boleto em aberto');
insert into public.payments (invoice_id, amount, paid_at, method)
select id, 1500, now(), 'pix' from public.invoices
 where lease_id = '20000000-0000-0000-0000-000000000002' and competence = date_trunc('month', current_date);
select pg_temp.check((select status from public.invoices where lease_id = '20000000-0000-0000-0000-000000000002' and competence = date_trunc('month', current_date)) = 'paid',
  'pagamento completo dá baixa automática no boleto');
select pg_temp.check((select count(*) from public.notifications where type = 'payment_confirmed'
  and user_id = '00000000-0000-0000-0000-0000000000c2') = 1, 'inquilino é avisado do pagamento confirmado');
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
select pg_temp.check((select count(*) from public.payments) = 0, 'inquilino não vê pagamentos de outro contrato');
commit;
do $$ begin
  begin
    update public.invoices set amount = 1 where status = 'paid';
    raise exception 'FALHOU: alterou valor de boleto pago';
  exception when check_violation then raise notice 'ok  valor de boleto pago não pode ser alterado';
  end;
end $$;


-- ---------- Etapa 4: chamados, comunicados, indicações ----------
select pg_temp.check((select count(*) from public.notifications where type = 'ticket_new'
  and user_id = '00000000-0000-0000-0000-0000000000a1') = 1, 'equipe é avisada de chamado novo');
select pg_temp.check((select count(*) from public.ticket_events where to_status = 'new') = 1, 'abertura registrada na linha do tempo');
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
update public.tickets set status = 'in_progress';
insert into public.ticket_events (ticket_id, author_id, message, internal)
  select id, '00000000-0000-0000-0000-0000000000a1', 'Orçamento do encanador: R$ 300', true from public.tickets;
insert into public.ticket_events (ticket_id, author_id, message)
  select id, '00000000-0000-0000-0000-0000000000a1', 'Encanador agendado para amanhã às 9h.' from public.tickets;
commit;
select pg_temp.check((select count(*) from public.ticket_events where from_status = 'new' and to_status = 'in_progress') = 1,
  'mudança de status registrada na linha do tempo');
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
select pg_temp.check((select count(*) from public.ticket_events where internal) = 0, 'inquilino não vê notas internas');
select pg_temp.check((select count(*) from public.notifications where type = 'ticket_message') = 1,
  'inquilino é avisado só da resposta pública');
insert into public.ticket_events (ticket_id, author_id, message)
  select id, '00000000-0000-0000-0000-0000000000c1', 'Obrigado!' from public.tickets;
commit;
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  begin
    update public.tickets set status = 'done';
    if (select status from public.tickets limit 1) = 'done' then raise exception 'FALHOU: inquilino mudou status'; end if;
    raise notice 'ok  inquilino não muda status do chamado';
  end;
  perform set_config('role', 'postgres', true);
end $$;
reset role;

insert into public.announcements (title, body, audience, target_role, published_at)
  values ('Feriado', 'Escritório fechado na sexta.', 'role', 'tenant', now());
select pg_temp.check((select count(*) from public.notifications where type = 'announcement') =
  (select count(*) from public.profiles where role = 'tenant' and status <> 'blocked'),
  'comunicado publicado chega a todos os inquilinos ativos');
insert into public.announcements (title, body, audience, scheduled_for)
  values ('Agendado', 'Depois', 'all', now() + interval '3 days');
begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select pg_temp.check((select count(*) from public.announcements) = 0, 'proprietário não vê comunicado de inquilinos nem agendado');
commit;

do $$ begin
  begin
    update public.referrals set status = 'reward_released', reward_validated_at = now() where status = 'received';
    raise exception 'FALHOU: recompensa liberada sem conversão';
  exception when check_violation then raise notice 'ok  recompensa só após conversão';
  end;
end $$;
update public.referrals set status = 'converted';
select pg_temp.check((select count(*) from public.notifications where type = 'referral_update') = 1, 'inquilino é avisado da conversão');


-- ---------- Auditoria ----------
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  begin
    insert into public.ticket_attachments (ticket_id, storage_path, mime_type, size_bytes, uploaded_by)
      select id, 'outro-chamado/foto.jpg', 'image/jpeg', 100, '00000000-0000-0000-0000-0000000000c1' from public.tickets limit 1;
    raise exception 'FALHOU: anexo apontou para fora da pasta do chamado';
  exception when insufficient_privilege then raise notice 'ok  anexo só na pasta do próprio chamado';
  end;
  perform public.log_activity('delete', 'documents', 'x', '{}');
  perform set_config('role', 'postgres', true);
end $$;
reset role;
select pg_temp.check((select count(*) from public.activity_logs where action = 'delete' and entity = 'documents' and entity_id = 'x') = 0,
  'app não consegue forjar ações arbitrárias na auditoria');
insert into public.documents (kind, title, storage_path, mime_type, size_bytes, property_id, base_year, published_at)
  values ('income_tax', 'IR 2026 A', 'ir/a-2026.pdf', 'application/pdf', 1000, '10000000-0000-0000-0000-000000000001', 2026, now());
select pg_temp.check((select link from public.notifications where title like 'Informe de Imposto%' order by created_at desc limit 1) = '/proprietario/documentos',
  'aviso de IR leva o proprietário à biblioteca de documentos');

\echo '>>> Todos os testes de permissão passaram.'
