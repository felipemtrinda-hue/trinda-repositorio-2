# Família Nardi — Website institucional

Site estático (HTML + CSS + JS puro, sem build). Para publicar, envie o conteúdo desta pasta para qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, cPanel).

Para visualizar localmente: `python3 -m http.server` dentro desta pasta e abrir http://localhost:8000.

## Estrutura
- `index.html` — página única: header, hero, manifesto, nosso café, essência, experiência, contato, rodapé e botão flutuante do WhatsApp.
- `politica-de-privacidade.html` — política (LGPD) básica; revisar com o jurídico.
- `assets/css/styles.css` — paleta em variáveis no topo (`--coffee`, `--bordeaux`, `--ivory`, `--copper`).
- `assets/js/main.js` — cabeçalho, menu mobile, revelações, parallax.
- `assets/brand/` — logo oficial e símbolo vetorizados a partir dos arquivos da marca.
- `assets/img/` — fotos do manual de marca em AVIF/WebP responsivos.

## Pendências de conteúdo (procure por `EDITAR` no HTML)
- Domínio definitivo (canonical, Open Graph, sitemap.xml, robots.txt).
- Confirmar a embalagem de 250 g como apresentação vigente.
- Características sensoriais confirmadas (torra, perfil, moagem) — bloco comentado em "Nosso café".
- História real da família e fotografia autêntica (família/produção/origem) em "Nossa essência".
- Perfis oficiais nas redes sociais (coluna comentada no rodapé).
