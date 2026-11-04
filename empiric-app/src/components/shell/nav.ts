import {
  FolderOpen, Plus, Search, Building2, CalendarDays, ChartColumn, FileText, Gift, Home, KeyRound, LayoutDashboard, Megaphone,
  Receipt, Settings, UserRound, Users, Wallet, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/auth";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
    { href: "/admin/imoveis", label: "Imóveis", icon: Building2 },
    { href: "/admin/proprietarios", label: "Proprietários", icon: KeyRound },
    { href: "/admin/inquilinos", label: "Inquilinos", icon: Users },
    { href: "/admin/contratos", label: "Contratos", icon: FileText },
    { href: "/admin/financeiro", label: "Boletos", icon: Wallet },
    { href: "/admin/documentos", label: "Documentos", icon: FolderOpen },
    { href: "/admin/chamados", label: "Chamados", icon: Wrench },
    { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/admin/comunicados", label: "Comunicados", icon: Megaphone },
    { href: "/admin/indicacoes", label: "Indique e Ganhe", icon: Gift },
    { href: "/admin/relatorios", label: "Relatórios", icon: ChartColumn },
    { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  ],
  owner: [
    { href: "/proprietario", label: "Início", icon: Home },
    { href: "/proprietario/imoveis", label: "Meus imóveis", icon: Building2 },
    { href: "/proprietario/financeiro", label: "Recibos", icon: Receipt },
    { href: "/proprietario/documentos", label: "Documentos", icon: FileText },
    { href: "/proprietario/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/proprietario/avisos", label: "Avisos", icon: Megaphone },
  ],
  tenant: [
    { href: "/inquilino", label: "Início", icon: Home },
    { href: "/inquilino/faturas", label: "Faturas", icon: Receipt },
    { href: "/inquilino/chamados", label: "Manutenção", icon: Wrench },
    { href: "/inquilino/documentos", label: "Contrato e vistoria", icon: FileText },
    { href: "/inquilino/avisos", label: "Avisos", icon: Megaphone },
    { href: "/inquilino/indique", label: "Indique e Ganhe", icon: Gift },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administração", owner: "Área do proprietário", tenant: "Área do inquilino",
};

export const ACCOUNT_ITEM: NavItem = { href: "/conta", label: "Minha conta", icon: UserRound };

/** Ação principal de cada perfil — botão central da barra inferior no celular. */
export const PRIMARY_ACTION: Record<Role, NavItem> = {
  admin: { href: "/admin/imoveis", label: "Buscar imóvel", icon: Search },
  owner: { href: "/proprietario/financeiro", label: "Recibos", icon: Receipt },
  tenant: { href: "/inquilino/chamados", label: "Abrir chamado", icon: Plus },
};
