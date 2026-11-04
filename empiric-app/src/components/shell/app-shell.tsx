"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Bell, ChevronsLeft, LogOut, Menu, X } from "lucide-react";
import type { Role } from "@/lib/auth";
import { NAV, ROLE_LABEL } from "./nav";

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
  const collapsed = useSyncExternalStore(subscribeSidebar, readSidebar, () => false);
  // O menu "Mais" fecha sozinho ao navegar: fica aberto só na rota em que foi aberto.
  const [sheetPath, setSheetPath] = useState<string | null>(null);
  const sheetOpen = sheetPath === path;
  const setSheetOpen = (open: boolean) => setSheetPath(open ? path : null);

  const toggle = () => writeSidebar(!collapsed);

  const initials = userName.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const mobilePrimary = items.slice(0, 4);

  return (
    <div className="min-h-dvh lg:flex">
      {/* ---------- Menu lateral (desktop) ---------- */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col bg-vinho text-white transition-[width] duration-300 lg:flex ${collapsed ? "w-[84px]" : "w-[268px]"}`}
        aria-label="Menu principal"
      >
        <div className="flex h-20 items-center justify-between px-5">
          <Link href={root} className="flex items-center gap-3" aria-label="Empiric — início">
            <Image src="/brand/empiric-icon.png" alt="" width={40} height={40} className="rounded-xl" priority />
            {!collapsed && (
              <span className="leading-tight">
                <span className="block font-semibold tracking-[0.14em]">EMPIRIC</span>
                <span className="block text-[10px] tracking-[0.12em] text-white/60">NEGÓCIOS IMOBILIÁRIOS</span>
              </span>
            )}
          </Link>
        </div>
        {!collapsed && <p className="eyebrow px-6 pb-2 !text-white/50">{ROLE_LABEL[role]}</p>}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href, root);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={`group flex h-11 items-center gap-3 rounded-full px-4 text-[14.5px] transition-colors ${
                  active ? "bg-white text-vinho font-medium" : "text-white/80 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <form action="/auth/sair" method="post">
            <button className={`flex h-11 w-full items-center gap-3 rounded-full px-4 text-sm text-white/75 hover:bg-white/10 hover:text-white ${collapsed ? "justify-center px-0" : ""}`}>
              <LogOut className="size-[18px]" aria-hidden />
              {!collapsed && "Sair"}
            </button>
          </form>
          <button
            onClick={toggle}
            className={`mt-1 flex h-10 w-full items-center gap-3 rounded-full px-4 text-xs text-white/55 hover:text-white ${collapsed ? "justify-center px-0" : ""}`}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <ChevronsLeft className={`size-4 transition-transform ${collapsed ? "rotate-180" : ""}`} aria-hidden />
            {!collapsed && "Recolher menu"}
          </button>
        </div>
      </aside>

      {/* ---------- Conteúdo ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-cream bg-canvas/85 px-4 backdrop-blur-md md:px-8 lg:h-20">
          <Link href={root} className="flex items-center gap-2 lg:hidden" aria-label="Empiric — início">
            <Image src="/brand/empiric-horizontal.png" alt="Empiric Negócios Imobiliários" width={126} height={72} className="h-11 w-auto" priority />
          </Link>
          <p className="hidden text-sm text-stone lg:block">
            Olá, <span className="font-medium text-charcoal">{userName.split(" ")[0]}</span>
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`${root}/notificacoes`}
              className="relative grid size-10 place-items-center rounded-full border border-cream bg-paper text-graphite hover:border-rose-line"
              aria-label={unread ? `Notificações (${unread} não lidas)` : "Notificações"}
            >
              <Bell className="size-[18px]" aria-hidden />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-bordo px-1 text-[10px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <span className="grid size-10 place-items-center rounded-full bg-vinho text-sm font-medium text-white" aria-hidden>
              {initials}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-28 pt-8 md:px-8 lg:pb-16">{children}</main>
      </div>

      {/* ---------- Navegação inferior (celular/tablet) ---------- */}
      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[20px] border border-cream bg-paper/95 px-1 py-1.5 shadow-[var(--shadow-float)] backdrop-blur lg:hidden"
        aria-label="Navegação"
      >
        {mobilePrimary.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href, root);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={`flex min-w-[64px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] ${active ? "bg-rose-mist font-medium text-vinho" : "text-stone"}`}>
              <Icon className="size-5" aria-hidden />
              <span className="max-w-[72px] truncate">{label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button onClick={() => setSheetOpen(true)} className="flex min-w-[64px] flex-col items-center gap-0.5 px-2 py-1.5 text-[11px] text-stone" aria-expanded={sheetOpen}>
          <Menu className="size-5" aria-hidden />
          Mais
        </button>
      </nav>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-vinho/40 animate-[var(--animate-fade)]" onClick={() => setSheetOpen(false)} aria-label="Fechar menu" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[24px] bg-paper p-4 pb-8 shadow-[var(--shadow-float)] animate-[var(--animate-rise)]">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="eyebrow">{ROLE_LABEL[role]}</p>
              <button onClick={() => setSheetOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-canvas" aria-label="Fechar">
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-xs ${isActive(path, href, root) ? "border-bordo bg-rose-mist text-vinho" : "border-cream text-graphite"}`}>
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              ))}
            </div>
            <form action="/auth/sair" method="post" className="mt-3">
              <button className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-cream text-sm text-graphite">
                <LogOut className="size-4" /> Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
