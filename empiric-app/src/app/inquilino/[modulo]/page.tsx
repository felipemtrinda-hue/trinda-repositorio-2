import { PlannedPage } from "@/components/modules/planned-page";
import { TENANT_MODULES } from "@/components/modules/planned";

export default async function Page({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo } = await params;
  return <PlannedPage map={TENANT_MODULES} slug={modulo} eyebrow="Área do inquilino" />;
}
