import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="eyebrow mb-3">Erro 404</p>
        <h1 className="display text-[48px]">Página <em>não encontrada</em></h1>
        <p className="mt-3 text-stone">O endereço pode ter mudado ou você não tem acesso a ele.</p>
        <ButtonLink href="/" className="mt-8">Voltar ao início</ButtonLink>
      </div>
    </main>
  );
}
