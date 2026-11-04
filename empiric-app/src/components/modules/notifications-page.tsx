import { Bell, CheckCheck } from "lucide-react";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { relative } from "@/lib/format";

export async function NotificationsPage({ basePath }: { basePath: string }) {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("notifications").select("id, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false }).limit(50);

  async function markAllRead() {
    "use server";
    const sb = await createClient();
    await sb.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    revalidatePath(basePath, "layout");
  }

  const unread = items?.filter((n) => !n.read_at).length ?? 0;
  return (
    <>
      <PageHeader eyebrow="Central" title="Suas" accent="notificações"
        actions={unread > 0 ? (
          <form action={markAllRead}>
            <button className="inline-flex h-10 items-center gap-2 rounded-full border border-cream bg-paper px-4 text-sm font-medium hover:border-rose-line">
              <CheckCheck className="size-4" /> Marcar todas como lidas
            </button>
          </form>
        ) : undefined} />
      <Card className="divide-y divide-cream overflow-hidden">
        {!items?.length ? (
          <EmptyState icon={Bell} title="Nenhuma notificação por aqui" description="Avisos de boletos, documentos e chamados aparecerão nesta central." />
        ) : items.map((n) => (
          <a key={n.id} href={`/api/notificacoes/${n.id}`} className={`flex gap-4 px-6 py-4 transition-colors hover:bg-mist ${n.read_at ? "" : "bg-rose-mist/40"}`}>
            <span className={`mt-2 size-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-bordo"}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{n.title}</p>
              {n.body && <p className="text-sm text-stone">{n.body}</p>}
            </div>
            <time className="shrink-0 text-xs text-stone" dateTime={n.created_at}>{relative(n.created_at)}</time>
          </a>
        ))}
      </Card>
    </>
  );
}
