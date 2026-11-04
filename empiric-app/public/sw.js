/* Empiric Imob — service worker
 * Estratégia conservadora para um portal com dados pessoais:
 *  • NUNCA guarda páginas autenticadas, respostas de API ou do Supabase.
 *  • Guarda só arquivos estáticos versionados (/_next/static, /brand, /icons, fontes).
 *  • Sem rede, navegações mostram /offline.html.
 */
const VERSION = "empiric-v1";
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/brand/empiric-horizontal.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/") ||
   url.pathname.startsWith("/icons/") || url.pathname.startsWith("/_next/static/media/"));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Páginas: sempre da rede; offline → página de aviso (nada pessoal fica em cache)
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  // Estáticos imutáveis: cache primeiro
  if (isStatic(url)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
  // Todo o resto (APIs, Supabase, imagens assinadas) passa direto pela rede.
});
