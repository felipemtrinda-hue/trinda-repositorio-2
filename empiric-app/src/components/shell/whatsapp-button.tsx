/** Botão fixo de WhatsApp. O número vem de Configurações → WhatsApp (settings). */
export function WhatsAppButton({ number, message }: { number: string | null; message?: string | null }) {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  const href = `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Empiric pelo WhatsApp"
      className="fixed bottom-24 right-4 z-40 grid size-14 place-items-center rounded-full bg-[#1f8f4e] text-white shadow-[var(--shadow-float)] transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
    >
      <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.09 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.31l-.35-.2-3.57.93.96-3.48-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.2 4.24-9.44 9.46-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.77 6.68c0 5.21-4.24 9.44-9.46 9.44m8.05-17.5A11.32 11.32 0 0 0 12.05.67C5.78.67.67 5.77.67 12.05c0 2 .52 3.96 1.52 5.69L.57 23.67l6.07-1.59a11.37 11.37 0 0 0 5.41 1.38h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.34-8.05" />
      </svg>
    </a>
  );
}
