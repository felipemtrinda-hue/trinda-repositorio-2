import Image from "next/image";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1fr] lg:p-4">
      <aside className="bg-vinho-gradient relative hidden overflow-hidden rounded-[32px] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[480px] rounded-full bg-white/[0.06] blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-20 size-[420px] rounded-full bg-[#b8325a]/30 blur-3xl" />
        <Image src="/brand/empiric-vertical-white.png" alt="Empiric Negócios Imobiliários" width={160} height={160} priority className="relative h-auto w-[120px]" />
        <div className="relative max-w-md">
          <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/85 backdrop-blur">Portal do cliente</p>
          <h1 className="heading text-[52px] font-bold leading-[1.02] tracking-[-0.045em]">
            Seu imóvel,<br /><span className="text-[#f6c2d0]">em boas mãos.</span>
          </h1>
          <p className="mt-5 text-[17px] text-white/75">
            Boletos, contratos, recibos e manutenção em um só lugar — para proprietários, inquilinos e equipe Empiric.
          </p>
        </div>
        <p className="relative text-xs text-white/50">Acesso restrito a clientes e colaboradores da Empiric.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px] animate-[var(--animate-rise)]">
          <Image src="/brand/empiric-horizontal.png" alt="Empiric Negócios Imobiliários" width={175} height={100} priority className="mb-10 h-16 w-auto lg:hidden" />
          {children}
          <div className="mt-10"><InstallPrompt /></div>
        </div>
      </main>
    </div>
  );
}
