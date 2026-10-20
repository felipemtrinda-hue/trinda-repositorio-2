# Família Nardi — Website institucional

Site estático (HTML + CSS + JS, sem build). Publique o conteúdo desta pasta em qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, cPanel).
Para ver localmente: `python3 -m http.server` dentro desta pasta → http://localhost:8000 (o visualizador 3D precisa de servidor; não abre via `file://`).

## Estrutura
- `index.html` — barra de aviso, navegação, hero, manifesto, Sabor·Equilíbrio·Origem (rolagem fixada), Nosso Café (bento), Embalagem 360°, Essência e valores, Experiência, Contato, rodapé, WhatsApp flutuante.
- `assets/css/styles.css` — paleta em variáveis no topo.
- `assets/js/main.js` — navegação, animações de rolagem, carrossel.
- `assets/js/viewer360.js` — modelo 3D da embalagem (Three.js r170, em `assets/vendor/three`, licença MIT). Carregado só quando a seção se aproxima da tela.
- `assets/brand/` — logo e símbolo oficiais vetorizados.

## Pendências (procure por `EDITAR` no HTML)
- Domínio definitivo (canonical, Open Graph, sitemap.xml, robots.txt).
- Arte do verso e texto completo da lateral da embalagem para o modelo 3D (hoje o verso é preto liso e a lateral mostra só a frase "Alguns cafés despertam, outros permanecem.").
- Confirmar a embalagem de 250 g; características sensoriais confirmadas.
- História real e foto autêntica da família; perfis de redes sociais.
