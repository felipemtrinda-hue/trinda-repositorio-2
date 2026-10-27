# Site Disk Embalagens

Site institucional estático (HTML + CSS + JS, sem build). Para publicar na Vercel, defina `site-disk-embalagens` como Root Directory.

## Pendências antes da publicação
- [ ] Domínio definitivo (hoje: `diskembalagens.com.br` em canonical, og, sitemap, robots e JSON-LD)
- [ ] Horários completos de funcionamento (hoje: "Atendimento até as 18h")
- [ ] Número da fachada: o briefing diz 235; a imagem da fachada mostra 238
- [ ] Telefone fixo (42) 3224-0322 aparece na fachada: confirmar se entra no site
- [ ] Trocar a fachada (visualização 3D) e os recortes de produtos por fotos reais
- [ ] Confirmar as categorias e os produtos de cada uma
- [ ] Instagram: o carrossel usa 5 posts adicionados manualmente. Para atualizar sozinho, conectar um widget de feed (ex.: Behold, LightWidget) com a conta

## Auditoria (out/2026)
Medido com Lighthouse 12.2.1 em servidor local (laboratório, não dados de campo):
- Celular: performance 85 → 97, LCP 3,5 s → 2,6 s, FCP 2,6 s → 1,0 s, CLS 0
- Desktop: performance 98 → 100, CLS 0,09 → 0
- Acessibilidade, boas práticas e SEO: 100 nas duas medições; axe-core sem violações nas 3 páginas
- Após publicar na Vercel, conferir os Core Web Vitals reais no PageSpeed Insights / Search Console
