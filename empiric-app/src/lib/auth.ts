import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type Role = "admin" | "owner" | "tenant";

export type Profile = {
  id: string;
  role: Role;
  status: "invited" | "active" | "blocked";
  full_name: string;
  email: string;
};

export const HOME_BY_ROLE: Record<Role, string> = {
  admin: "/admin",
  owner: "/proprietario",
  tenant: "/inquilino",
};

/** Perfil do usuário logado (memoizado por requisição). */
export const getProfile = cache(async (): Promise<Profile | null> => {
  await connection(); // sempre por requisição — nunca pré-renderizar sessão
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, role, status, full_name, email")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
});

/**
 * Garante o papel no servidor. É uma camada de UX: a proteção real dos dados
 * é a RLS do banco (supabase/migrations/*_rls.sql).
 */
export async function requireRole(role: Role): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status === "blocked") redirect("/login?erro=bloqueado");
  if (profile.role !== role) redirect(HOME_BY_ROLE[profile.role]);
  return profile;
}
