/** Marca dados demonstrativos para que nunca sejam confundidos com reais. */
export function DemoNotice() {
  return (
    <p className="rounded-xl border border-dashed border-warning/40 bg-warning-bg px-4 py-2 text-xs text-warning">
      Dados demonstrativos — não representam imóveis ou clientes reais.
    </p>
  );
}
