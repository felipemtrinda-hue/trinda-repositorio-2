// Verificação automatizada do site Família Nardi.
// Uso: node testes/verificar-site.mjs
// Requer o Playwright (npm i -D playwright) ou PLAYWRIGHT_MODULE apontando para o index.mjs dele.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const PORT = 8790 + Math.floor(Math.random() * 100);
const BASE = `http://localhost:${PORT}/`;
const server = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: root, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));

const NUMBER = "554284043000";
const MSG_ORDER = "Olá! Gostaria de conhecer o café Família Nardi e consultar as opções de encomenda.";
const MSG_RESELL = "Olá! Tenho interesse em comercializar o café na minha loja e gostaria de conhecer as condições para me tornar revendedor.";
const PAGES = ["index.html", "revendedor.html", "politica-de-privacidade.html", "404.html"];
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];

let failures = 0;
const check = (ok, label) => { console.log(`${ok ? "✔" : "✘"} ${label}`); if (!ok) failures++; };

// Código: sem vermelho institucional e sem o texto antigo do CTA
const css = readFileSync(path.join(root, "assets/css/styles.css"), "utf8");
check(!/#8e2233|bordeaux/i.test(css), "CSS sem o bordô institucional");
for (const p of PAGES) {
  const html = readFileSync(path.join(root, p), "utf8");
  check(!html.includes("Solicitar uma encomenda"), `${p}: sem "Solicitar uma encomenda"`);
}

const browser = await chromium.launch();
try {
  for (const p of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("response", (r) => { if (r.status() >= 400 && !r.url().endsWith("404.html")) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(BASE + p, { waitUntil: "networkidle" });

    const links = await page.$$eval("a[href]", (as) => as.map((a) => ({ href: a.getAttribute("href"), target: a.target, rel: a.rel })));
    for (const l of links.filter((l) => l.href.startsWith("#"))) {
      check(await page.$(`[id="${l.href.slice(1)}"]`) !== null, `${p}: âncora ${l.href} existe`);
    }
    for (const l of links.filter((l) => l.href.includes("wa.me"))) {
      const u = new URL(l.href);
      const text = u.searchParams.get("text");
      check(u.pathname === `/${NUMBER}` && (text === null || text === MSG_ORDER || text === MSG_RESELL), `${p}: WhatsApp válido (${text ? text.slice(0, 32) + "…" : "sem mensagem"})`);
      check(l.target !== "_blank" || /noopener/.test(l.rel), `${p}: link externo com rel=noopener`);
    }
    for (const l of links.filter((l) => /\.html/.test(l.href) && !l.href.startsWith("http"))) {
      const res = await page.request.get(new URL(l.href.split("#")[0], BASE + p).href);
      check(res.ok(), `${p}: link interno ${l.href} responde ${res.status()}`);
    }
    const navText = await page.$$eval(".nav__links a", (as) => as.map((a) => a.textContent.trim()));
    check(navText.includes("Seja um revendedor"), `${p}: menu tem "Seja um revendedor"`);
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(120);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      check(ov === 0, `${p}: sem rolagem horizontal em ${w}px`);
    }
    check(errors.length === 0, `${p}: sem erros de console/rede ${errors.length ? JSON.stringify(errors) : ""}`);
    await page.close();
  }

  // Fluxos: menu mobile, galeria e CTA de encomenda
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await m.goto(BASE, { waitUntil: "networkidle" });
  await m.click(".menu-btn");
  check(await m.$eval("#menu", (el) => el.classList.contains("is-open")), "menu mobile abre");
  await m.keyboard.press("Escape");
  check(!(await m.$eval("#menu", (el) => el.classList.contains("is-open"))), "menu mobile fecha com Esc");
  await m.click(".menu-btn");
  await m.click('#menu a[href="revendedor.html"]');
  await m.waitForURL(/revendedor\.html/);
  check(true, "menu mobile leva à página de revendedor");
  await m.close();

  const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await d.goto(BASE, { waitUntil: "networkidle" });
  const cta = await d.$eval(".nav__actions .pill", (a) => a.textContent.trim());
  check(cta === "Solicitar encomenda", `CTA do topo: "${cta}"`);
  await d.click(".gal__btn >> nth=0");
  check(await d.$eval(".lightbox", (el) => el.open), "galeria abre a imagem ampliada");
  await d.keyboard.press("ArrowRight");
  check((await d.$eval(".lightbox__cap", (el) => el.textContent)).includes("2/"), "galeria avança com a seta");
  await d.keyboard.press("Escape");
  check(!(await d.$eval(".lightbox", (el) => el.open)), "galeria fecha com Esc");
  await d.close();
} finally {
  await browser.close();
  server.kill();
}

console.log(failures ? `\n${failures} verificação(ões) falharam.` : "\nTodas as verificações passaram.");
process.exit(failures ? 1 : 0);
