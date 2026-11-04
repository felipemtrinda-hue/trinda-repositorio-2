import { getProfile, requireRole, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "./app-shell";
import { WhatsAppButton } from "./whatsapp-button";
import { Suspense } from "react";
import { Toast } from "@/components/ui/toast";

export async function RoleLayout({ role, children }: { role: Role; children: React.ReactNode }) {
  await requireRole(role);
  const profile = (await getProfile())!;
  const supabase = await createClient();

  const [{ count }, { data: wa }] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    role === "tenant"
      ? supabase.from("settings").select("value").eq("key", "whatsapp").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const whatsapp = wa?.value as { number: string | null; default_message?: string } | undefined;

  return (
    <AppShell role={role} userName={profile.full_name} unread={count ?? 0}>
      {children}
      <Suspense><Toast /></Suspense>
      {role === "tenant" && <WhatsAppButton number={whatsapp?.number ?? null} message={whatsapp?.default_message} />}
    </AppShell>
  );
}
