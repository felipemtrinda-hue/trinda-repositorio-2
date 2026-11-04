"use client";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-6 text-center">
      <div>
        <h1 className="display text-[40px]">Algo <em>deu errado</em></h1>
        <p className="mt-3 text-stone">Não conseguimos carregar esta tela. Tente novamente em instantes.</p>
        <Button onClick={reset} className="mt-6">Tentar de novo</Button>
      </div>
    </div>
  );
}
