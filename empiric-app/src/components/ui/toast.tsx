"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

export const TOASTS: Record<string, string> = {
  imovel_salvo: "Imóvel salvo.",
  imovel_arquivado: "Imóvel arquivado.",
  pessoa_convidada: "Convite enviado por e-mail.",
  pessoa_salva: "Cadastro atualizado.",
  pessoa_bloqueada: "Acesso bloqueado.",
  pessoa_desbloqueada: "Acesso liberado.",
  contrato_salvo: "Contrato salvo.",
  status_contrato: "Situação do contrato atualizada.",
  evento_salvo: "Evento adicionado à agenda.",
  evento_removido: "Evento removido.",
  vinculo_salvo: "Proprietário vinculado.",
  vinculo_removido: "Vínculo removido.",
  fotos_salvas: "Fotos adicionadas.",
  foto_removida: "Foto removida.",
  doc_enviado: "Documento enviado.",
  doc_publicado: "Documento publicado e destinatários avisados.",
  doc_oculto: "Documento ocultado dos clientes.",
  doc_removido: "Documento excluído.",
  boleto_salvo: "Boleto salvo.",
  boleto_publicado: "Boleto publicado. O inquilino foi avisado.",
  boleto_cancelado: "Boleto cancelado.",
  pagamento_registrado: "Pagamento registrado.",
  pagamento_estornado: "Pagamento estornado.",
};

/** Mostra a confirmação vinda de ?ok=<chave> e limpa a URL. */
export function Toast() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const key = params.get("ok");
  const [hidden, setHidden] = useState<string | null>(null);
  const message = key && key !== hidden ? TOASTS[key] : null;

  useEffect(() => {
    if (!key) return;
    const t = setTimeout(() => {
      setHidden(key);
      const next = new URLSearchParams(params);
      next.delete("ok");
      router.replace(next.size ? `${path}?${next}` : path, { scroll: false });
    }, 3200);
    return () => clearTimeout(t);
  }, [key, params, path, router]);

  if (!message) return null;
  return (
    <div role="status" className="fixed left-1/2 top-4 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full bg-charcoal py-2.5 pl-4 pr-2 text-sm text-white shadow-[var(--shadow-float)] animate-[var(--animate-rise)]">
      <CheckCircle2 className="size-4 text-[#7fe0a8]" aria-hidden /> {message}
      <button onClick={() => setHidden(key)} className="grid size-7 place-items-center rounded-full hover:bg-white/10" aria-label="Fechar"><X className="size-3.5" /></button>
    </div>
  );
}
