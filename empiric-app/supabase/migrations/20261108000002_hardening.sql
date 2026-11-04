-- =============================================================================
-- EMPIRIC IMOB — Endurecimento apontado pelo Security Advisor do Supabase
-- =============================================================================

-- Funções de gatilho não devem ser chamáveis pela API (/rest/v1/rpc/...).
revoke execute on function
  public.audit_row(), public.handle_new_user(), public.sync_profile_from_auth(),
  public.on_announcement_published(), public.on_document_published(), public.on_invoice_change(),
  public.on_lease_status(), public.on_payment_change(), public.on_referral_change(),
  public.on_ticket_created(), public.on_ticket_message(), public.on_ticket_status(),
  public.on_ticket_status_event(), public.sync_lease_events(),
  public.touch_updated_at(), public.guard_profile_update(), public.guard_paid_invoice(),
  public.guard_referral_reward(), public.check_link_roles(), public.check_owner_shares(),
  public.set_ticket_closed_at()
from public, anon, authenticated;

-- Caminho de busca fixo em todas as funções.
alter function public.touch_updated_at()       set search_path = public;
alter function public.guard_profile_update()   set search_path = public;
alter function public.guard_paid_invoice()     set search_path = public;
alter function public.guard_referral_reward()  set search_path = public;
alter function public.check_link_roles()       set search_path = public;
alter function public.check_owner_shares()     set search_path = public;
alter function public.set_ticket_closed_at()   set search_path = public;

-- Funções de permissão usadas pela RLS: só usuários logados (nunca anônimos).
revoke execute on function public.me(), public.is_admin(), public.owns_property(uuid),
  public.rents_property(uuid), public.can_see_property(uuid), public.is_lease_tenant(uuid),
  public.can_see_ticket(uuid), public.admin_dashboard_summary(),
  public.log_activity(text, text, text, jsonb)
from public, anon;
