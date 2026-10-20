# Família Nardi — Website institucional

Site estático (HTML + CSS + JS, sem build). Publique o conteúdo desta pasta em qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, cPanel).
Para ver localmente: `python3 -m http.server` dentro desta pasta → http://localhost:8000 (o visualizador 3D precisa de servidor; não abre via `file://`).

## Estrutura
- `index.html` — barra de aviso, navegação, hero, manifesto, Sabor·Equilíbrio·Origem (rolagem fixada), Nosso Café (bento), Embalagem 360°, Essência e valores, Experiência, Contato, rodapé, WhatsApp flutuante.
- `assets/css/styles.css` — paleta em variáveis no topo.
- `assets/js/main.js` — navegação, animações de rolagem, carrossel.
- `assets/js/viewer360.js` — modelo 3D da embalagem (Three.js r170, em `assets/vendor/three`, licença MIT). Carregado só quando a seção se aproxima da tela.
- `assets/brand/` — logo e símbolo oficiais vetorizados.
- Galeria "A marca em aplicações" — imagens do manual de identidade (`assets/img/g-*`), com visualização ampliada.

## Vídeos (plantação, cafeeiro, fruto, grão, xícara)
O site já tem cinco espaços para vídeo, hoje desativados (`data-video=""`). Para ativar um, gere os arquivos com o script abaixo e preencha o atributo no `index.html`, por exemplo `data-video="assets/video/plantacao"` no elemento com `data-video-name="plantacao"`. O vídeo só carrega quando a seção se aproxima da tela; sem vídeo, aparece a imagem/gravura atual.

| Nome | Onde aparece | Sugestão |
|---|---|---|
| `plantacao` | Faixa "Cada xícara começa no campo" (tela cheia) | plantação de café arábica, 8–12 s, horizontal |
| `cafeeiro` | Card 01 | ramos e folhas do cafeeiro balançando |
| `fruto` | Card 02 | frutos maduros (vermelhos) no pé ou na colheita |
| `grao` | Card 03 | grãos torrados caindo ou sendo moídos |
| `xicara` | Card 04 | café sendo servido, vapor na xícara |

Para preparar cada vídeo (gera `.mp4` e `.webm` leves, sem áudio, em `assets/video/`):

```bash
ferramentas/preparar-video.sh ~/Downloads/fazenda.mp4 plantacao
ferramentas/preparar-video.sh ~/Downloads/frutos.mp4 fruto 960 8
```

Prefira vídeos próprios da família/fazenda. Se usar banco de imagens (Pexels, Pixabay), confira a licença de uso comercial.

## Pendências (procure por `EDITAR` no HTML)
- Domínio definitivo (canonical, Open Graph, sitemap.xml, robots.txt).
- Arte do verso e texto completo da lateral da embalagem para o modelo 3D (hoje o verso é preto liso e a lateral mostra só a frase "Alguns cafés despertam, outros permanecem.").
- Confirmar a embalagem de 250 g; características sensoriais confirmadas.
- História real e foto autêntica da família; perfis de redes sociais.
