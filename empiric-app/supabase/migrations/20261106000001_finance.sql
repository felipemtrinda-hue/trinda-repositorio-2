-- =============================================================================
-- EMPIRIC IMOB — Etapa 3 · financeiro
-- Pagamento registrado (manual ou webhook) → baixa automática do boleto.
-- =============================================================================

create or replace function public.on_payment_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_invoice uuid := coalesce(new.invoice_id, old.invoice_id);
  v_total   numeric(12,2);
  v_last    timestamptz;
  v_amount  numeric(12,2);
  v_status  public.invoice_status;
begin
  select amount, status into v_amount, v_status from public.invoices where id = v_invoice;
  if tg_op = 'INSERT' and v_status = 'cancelled' then
    raise exception 'Não é possível registrar pagamento em boleto cancelado.' using errcode = '23514';
  end if;

  select coalesce(sum(amount), 0), max(paid_at) into v_total, v_last
    from public.payments where invoice_id = v_invoice;

  if v_total >= v_amount and v_total > 0 then
    update public.invoices set status = 'paid', paid_at = v_last, paid_amount = v_total
     where id = v_invoice and status <> 'paid';
  else
    -- pagamento estornado/parcial: volta a ficar em aberto (ou vencido)
    update public.invoices set
      status = case when due_date < (now() at time zone 'America/Sao_Paulo')::date then 'overdue'::public.invoice_status
                    else 'pending'::public.invoice_status end,
      paid_at = null, paid_amount = nullif(v_total, 0)
     where id = v_invoice and status in ('paid', 'pending', 'overdue');
  end if;
  return coalesce(new, old);
end $$;

create trigger payments_settle
  after insert or update or delete on public.payments
  for each row execute function public.on_payment_change();

-- Boleto pago não pode ter valor alterado
create or replace function public.guard_paid_invoice()
returns trigger language plpgsql as $$
begin
  if old.status = 'paid' and new.amount is distinct from old.amount then
    raise exception 'Boleto já pago: o valor não pode ser alterado.' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger invoices_guard_paid before update on public.invoices
  for each row execute function public.guard_paid_invoice();
