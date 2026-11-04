import { RoleLayout } from "@/components/shell/role-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role="admin">{children}</RoleLayout>;
}
