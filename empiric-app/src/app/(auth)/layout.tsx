import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-vinho p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -right-8 top-40 size-[260px] rounded-full border border-white/10" />
        <Image src="/brand/empiric-vertical.png" alt="Empiric Negócios Imobiliários" width={170} height={212} priority className="h-auto w-[150px]" />
        <div className="max-w-md">
          <p className="eyebrow mb-4 !text-white/60">Portal do cliente</p>
          <h1 className="display text-[56px]">
            Seu imóvel, <em className="!text-[#f3c9d4]">em boas mãos</em>.
          </h1>
          <p className="mt-5 text-white/75">
            Boletos, contratos, recibos e chamados de manutenção em um só lugar — para proprietários, inquilinos e equipe Empiric.
          </p>
        </div>
        <p className="text-xs text-white/50">Acesso restrito a clientes e colaboradores da Empiric.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px] animate-[var(--animate-rise)]">
          <Image src="/brand/empiric-horizontal.png" alt="Empiric Negócios Imobiliários" width={175} height={100} priority className="mb-10 h-14 w-auto lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
