import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function leaseOptions() {
  const supabase = await createClient();
  const [{ data: props }, { data: tenants }] = await Promise.all([
    supabase.from("properties").select("id, title, code").neq("status", "archived").order("title"),
    supabase.from("profiles").select("id, full_name, email").eq("role", "tenant").neq("status", "blocked").order("full_name"),
  ]);
  return {
    properties: (props ?? []).map((p) => ({ value: p.id, label: p.code ? `${p.title} (#${p.code})` : p.title })),
    tenants: (tenants ?? []).map((t) => ({ value: t.id, label: `${t.full_name} · ${t.email}` })),
  };
}
