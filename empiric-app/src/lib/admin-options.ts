import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Opções de seleção para formulários da administração. */
export async function adminOptions() {
  const supabase = await createClient();
  const [{ data: props }, { data: leases }, { data: people }] = await Promise.all([
    supabase.from("properties").select("id, title").neq("status", "archived").order("title"),
    supabase.from("leases").select("id, property_id, status, start_date, due_day, rent_amount, property:properties(title), tenant:profiles(full_name)")
      .in("status", ["active", "awaiting_signature", "draft", "ended"]).order("start_date", { ascending: false }),
    supabase.from("profiles").select("id, full_name, role").in("role", ["owner", "tenant"]).neq("status", "blocked").order("full_name"),
  ]);
  const one = <T,>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
  return {
    properties: (props ?? []).map((p) => ({ value: p.id, label: p.title })),
    leases: (leases ?? []).map((l) => ({
      value: l.id, property_id: l.property_id, status: l.status, due_day: l.due_day, rent: Number(l.rent_amount),
      label: `${(one(l.property) as { title: string })?.title} · ${(one(l.tenant) as { full_name: string })?.full_name}${l.status === "active" ? "" : " (inativo)"}`,
    })),
    people: (people ?? []).map((p) => ({ value: p.id, label: `${p.full_name} · ${p.role === "owner" ? "proprietário" : "inquilino"}` })),
  };
}
