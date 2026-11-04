import { PlannedPage } from "@/components/modules/planned-page";
import { ADMIN_MODULES } from "@/components/modules/planned";

export default async function Page({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo } = await params;
  return <PlannedPage map={ADMIN_MODULES} slug={modulo} eyebrow="Administração" />;
}
