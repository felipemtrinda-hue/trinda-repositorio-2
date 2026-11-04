"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Bell, ChevronsLeft, LayoutGrid, LogOut, X } from "lucide-react";
import type { Role } from "@/lib/auth";
import { NAV, PRIMARY_ACTION, ROLE_LABEL } from "./nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";

type Props = { role: Role; userName: string; unread: number; children: React.ReactNode };

const SIDEBAR_KEY = "empiric:sidebar";
const sidebarListeners = new Set<() => void>();
function subscribeSidebar(cb: () => void) {
  sidebarListeners.add(cb);
  return () => { sidebarListeners.delete(cb); };
}
function readSidebar() {
  try { return localStorage.getItem(SIDEBAR_KEY) === "1"; } catch { return false; }
}
function writeSidebar(v: boolean) {
  try { localStorage.setItem(SIDEBAR_KEY, v ? "1" : "0"); } catch {}
  sidebarListeners.forEach((l) => l());
}

function isActive(path: string, href: string, root: string) {
  return href === root ? path === href : path === href || path.startsWith(href + "/");
}

export function AppShell({ role, userName, unread, children }: Props) {
  const path = usePathname();
  const items = NAV[role];
  const root = items[0].href;
  const primary = PRIMARY_ACTION[role];
  const collapsed = useSyncExternalStore(subscribeSidebar, readSidebar, () => false);
  // O menu "Mais" fecha sozinho ao navegar: fica aberto só na rota em que foi aberto.
  const [sheetPath, setSheetPath] = useState<string | null>(null);
  const sheetOpen = sheetPath === path;
  const setSheetOpen = (open: boolean) => setSheetPath(open ? path : null);

  const initials = userName.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const firstName = userName.split(" ")[0];
  // Barra inferior: 2 itens · ação central · 1 item · "Mais"
  const left = items.slice(0, 2);
  const right = items.slice(2, 3);

  return (
    <div className="min-h-dvh lg:flex">
      {/* ---------- Menu lateral (desktop) ---------- */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-cream bg-paper transition-[width] duration-300 lg:flex ${collapsed ? "w-[88px]" : "w-[264px]"}`}
        aria-label="Menu principal"
      >
        <div className={`flex h-24 items-center ${collapsed ? "justify-center" : "px-6"}`}>
          <Link href={root} aria-label="Empiric — início">
            {collapsed
              ? <Image src="/brand/empiric-icon.png" alt="" width={44} height={44} className="rounded-[14px]" priority />
              : <Image src="/brand/empiric-horizontal.png" alt="Empiric Negócios Imobiliários" width={175} height={100} className="h-[68px] w-auto" priority />}
          </Link>
        </div>
        {!collapsed && <p className="eyebrow px-7 pb-2">{ROLE_LABEL[role]}</p>}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href, root);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-2xl px-4 text-[14.5px] transition-all ${
                  active
                    ? "bg-vinho-gradient font-semibold text-white shadow-[var(--shadow-brand)]"
                    : "text-graphite hover:bg-mist hover:text-charcoal"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 p-4">
          {!collapsed && (
            <div className="mb-2 flex items-center gap-3 rounded-2xl bg-mist p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-vinho-gradient text-xs font-semibold text-white">{initials}</span>
              <span className="min-w-0 text-sm"><span className="block truncate font-semibold">{userName}</span><span className="block truncate text-xs text-stone">{ROLE_LABEL[role]}</span></span>
            </div>
          )}
          <form action="/auth/sair" method="post">
            <button className={`flex h-11 w-full items-center gap-3 rounded-2xl px-4 text-sm text-graphite hover:bg-mist ${collapsed ? "justify-center px-0" : ""}`}>
              <LogOut className="size-[18px]" aria-hidden />
              {!collapsed && "Sair"}
            </button>
          </form>
          <button
            onClick={() => writeSidebar(!collapsed)}
            className={`flex h-10 w-full items-center gap-3 rounded-2xl px-4 text-xs text-stone hover:text-charcoal ${collapsed ? "justify-center px-0" : ""}`}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <ChevronsLeft className={`size-4 transition-transform ${collapsed ? "rotate-180" : ""}`} aria-hidden />
            {!collapsed && "Recolher menu"}
          </button>
        </div>
      </aside>

      {/* ---------- Conteúdo ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between gap-4 px-[max(1rem,env(safe-area-inset-left))] pt-[env(safe-area-inset-top)] md:px-8 lg:h-20 lg:pt-0">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-full bg-vinho-gradient text-sm font-semibold text-white" aria-hidden>{initials}</span>
            <span className="text-sm leading-tight"><span className="block text-stone">Olá,</span><span className="block font-semibold">{firstName}</span></span>
          </div>
          <p className="hidden text-sm text-stone lg:block">
            Olá, <span className="font-semibold text-charcoal">{firstName}</span> 👋
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`${root}/notificacoes`}
              className="relative grid size-11 place-items-center rounded-full bg-paper text-graphite shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-hover)]"
              aria-label={unread ? `Notificações (${unread} não lidas)` : "Notificações"}
            >
              <Bell className="size-[18px]" aria-hidden />
              {unread > 0 && (
                <span className="absolute right-2 top-2 size-2.5 rounded-full bg-bordo ring-2 ring-white" aria-hidden />
              )}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-6 md:px-8 lg:pb-16 lg:pt-8"><InstallPrompt />{children}</main>
      </div>

      {/* ---------- Barra inferior flutuante (celular/tablet) ---------- */}
      <nav
        className="glass fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex h-[68px] items-center justify-around rounded-[28px] px-2 shadow-[var(--shadow-float)] ring-1 ring-black/[0.04] lg:hidden"
        aria-label="Navegação"
      >
        {left.map((it) => <TabIcon key={it.href} item={it} active={isActive(path, it.href, root)} />)}
        <Link href={primary.href} aria-label={primary.label}
          className="-mt-8 grid size-[60px] place-items-center rounded-full bg-bordo text-white shadow-[var(--shadow-brand)] ring-[6px] ring-white transition active:scale-95">
          <primary.icon className="size-6" strokeWidth={2.2} aria-hidden />
        </Link>
        {right.map((it) => <TabIcon key={it.href} item={it} active={isActive(path, it.href, root)} />)}
        <button onClick={() => setSheetOpen(true)} aria-expanded={sheetOpen} aria-label="Mais opções"
          className="relative grid size-12 place-items-center rounded-full text-stone">
          <LayoutGrid className="size-[22px]" strokeWidth={1.8} aria-hidden />
        </button>
      </nav>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/25 backdrop-blur-[2px] animate-[var(--animate-fade)]" onClick={() => setSheetOpen(false)} aria-label="Fechar menu" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[32px] bg-paper p-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-float)] animate-[var(--animate-rise)]">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-smoke" aria-hidden />
            <div className="mb-4 flex items-center justify-between px-1">
              <p className="heading text-lg font-bold">{ROLE_LABEL[role]}</p>
              <button onClick={() => setSheetOpen(false)} className="grid size-9 place-items-center rounded-full bg-mist" aria-label="Fechar">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(path, href, root);
                return (
                  <Link key={href} href={href} className={`flex flex-col items-center gap-2 rounded-[20px] p-3.5 text-center text-xs font-medium ${active ? "bg-rose-mist text-vinho" : "bg-mist text-graphite"}`}>
                    <Icon className="size-5" aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </div>
            <form action="/auth/sair" method="post" className="mt-4">
              <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mist text-sm font-semibold text-graphite">
                <LogOut className="size-4" /> Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TabIcon({ item: { href, label, icon: Icon }, active }: { item: { href: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }; active: boolean }) {
  return (
    <Link href={href} aria-label={label} aria-current={active ? "page" : undefined}
      className={`relative grid size-12 place-items-center rounded-full transition-colors ${active ? "text-vinho" : "text-stone"}`}>
      <Icon className="size-[22px]" strokeWidth={active ? 2.3 : 1.8} />
      {active && <span className="absolute bottom-1 size-1 rounded-full bg-vinho" aria-hidden />}
    </Link>
  );
}
