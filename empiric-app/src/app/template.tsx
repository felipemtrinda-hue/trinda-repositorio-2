/** Transição suave entre páginas. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-[var(--animate-fade)]">{children}</div>;
}
