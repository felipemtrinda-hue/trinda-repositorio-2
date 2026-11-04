-- =============================================================================
-- EMPIRIC IMOB — Dados de demonstração (opcional)
-- Cria 3 contas de acesso e uma carteira fictícia, tudo marcado "DEMO".
-- Substitua __SENHA_ADMIN__, __SENHA_PROPRIETARIO__ e __SENHA_INQUILINO__
-- antes de executar. NÃO use em produção com clientes reais.
-- Para remover: delete from auth.users where email like '%@demo.empiric.local';
-- =============================================================================

create or replace function pg_temp.demo_user(p_email text, p_pass text, p_role text, p_name text)
returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_pass, extensions.gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', p_role, 'full_name', p_name),
    '{}'::jsonb, now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true), 'email', now(), now(), now());
  update public.profiles set status = 'active', lgpd_consent_at = now() where id = v_id;
  return v_id;
end $$;

do $$
declare
  a uuid; o uuid; t uuid; p1 uuid; p2 uuid; p3 uuid; l1 uuid; i uuid; m date := date_trunc('month', now())::date; k int;
begin
  a := pg_temp.demo_user('equipe@demo.empiric.local', '__SENHA_ADMIN__', 'admin', 'Equipe Empiric (DEMO)');
  o := pg_temp.demo_user('proprietario@demo.empiric.local', '__SENHA_PROPRIETARIO__', 'owner', 'Carlos Menezes (DEMO)');
  t := pg_temp.demo_user('inquilino@demo.empiric.local', '__SENHA_INQUILINO__', 'tenant', 'Mariana Souza (DEMO)');
  update public.profiles set phone = '42999000101' where id = o;
  update public.profiles set phone = '42999000001', whatsapp = '42999000001' where id = t;

  insert into public.properties (code, title, kind, status, description, street, number, complement, district, city, state, zip_code,
    bedrooms, bathrooms, parking_spots, area_m2, rent_amount, condo_amount, iptu_amount, features, created_by)
  values ('DEMO-302', 'DEMO · Apto 302 Ed. Jardim das Flores', 'apartment', 'available', 'Imóvel fictício para demonstração.',
    'Rua Exemplo', '410', 'Ap 302', 'Centro', 'Ponta Grossa', 'PR', '84010000', 2, 1, 1, 68, 1850, 360, 60, array['Sacada', 'Churrasqueira'], a)
  returning id into p1;
  insert into public.properties (code, title, kind, status, street, number, district, city, state, bedrooms, area_m2, rent_amount, created_by)
  values ('DEMO-088', 'DEMO · Casa Vila Estrela', 'house', 'available', 'Rua Fictícia', '88', 'Vila Estrela', 'Ponta Grossa', 'PR', 3, 120, 2600, a)
  returning id into p2;
  insert into public.properties (code, title, kind, status, street, number, district, city, state, area_m2, rent_amount, created_by)
  values ('DEMO-1204', 'DEMO · Sala comercial 1204', 'commercial', 'available', 'Av. Modelo', '1500', 'Centro', 'Ponta Grossa', 'PR', 42, 1400, a)
  returning id into p3;

  insert into public.property_owners (property_id, owner_id, share_pct) values (p1, o, 100), (p2, o, 100);

  insert into public.leases (property_id, tenant_id, status, start_date, end_date, due_day, rent_amount, adjustment_index)
  values (p1, t, 'active', (m - interval '10 months')::date, (m + interval '20 months')::date, 10, 1850, 'IGP-M')
  returning id into l1;

  -- 5 meses pagos + mês atual em aberto
  for k in reverse 5..0 loop
    insert into public.invoices (lease_id, competence, due_date, amount, status, published_at,
      barcode, pix_code)
    values (l1, (m - make_interval(months => k))::date, ((m - make_interval(months => k))::date + 9), 2270, 'pending', now(),
      '00000.00000 00000.000000 00000.000000 0 00000000000000 (DEMO)', 'PIX-DEMO-SEM-VALOR')
    returning id into i;
    insert into public.invoice_items (invoice_id, label, amount, position)
      values (i, 'Aluguel', 1850, 0), (i, 'Condomínio', 360, 1), (i, 'IPTU (parcela)', 60, 2);
    if k > 0 then
      insert into public.payments (invoice_id, amount, paid_at, method, source, recorded_by)
        values (i, 2270, ((m - make_interval(months => k))::date + 8)::timestamptz, 'pix', 'manual', a);
    end if;
  end loop;

  insert into public.calendar_events (kind, title, starts_at, property_id, visible_to_owner, created_by)
  values ('inspection', 'DEMO · Vistoria periódica', now() + interval '5 days', p1, true, a),
         ('payout', 'DEMO · Repasse aos proprietários', now() + interval '8 days', p1, true, a);
end $$;
