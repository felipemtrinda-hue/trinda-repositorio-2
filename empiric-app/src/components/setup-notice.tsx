import { Database } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="rounded-[16px] border border-dashed border-warning/40 bg-warning-bg p-5 text-sm text-warning">
      <p className="flex items-center gap-2 font-medium"><Database className="size-4" /> Configuração pendente</p>
      <p className="mt-1">
        Conecte o projeto Supabase preenchendo <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
        <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> no <code>.env.local</code>. Veja o README.
      </p>
    </div>
  );
}
