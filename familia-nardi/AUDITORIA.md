# Auditoria do site Família Nardi

Data: 20/10/2026 · Escopo: pasta `familia-nardi/` (site estático HTML + CSS + JS, sem build, sem backend).

## A. Resumo executivo
- **Estado inicial:** site funcional, sem erros de console, sem links quebrados, sem rolagem horizontal em 9 larguras. Problemas: bordô como cor de destaque, contraste insuficiente do cobre em textos pequenos (3,99:1), 4 imagens da jornada ampliadas além da resolução, CLS de 0,054 no desktop, menu quebrando em duas linhas entre 900 e 1180 px, efeitos de tendência (aurora em gradiente, vidro, botões magnéticos, faixa em loop contínuo).
- **Feito:** vermelho substituído pelo azul institucional; nova página **Seja um revendedor**; origem **Araguari, Minas Gerais** na home, na revenda, no rodapé e nos metadados; CTA trocado para **Solicitar encomenda**; nova seção com o key visual e a frase **"Alguns cafés despertam, outros permanecem."**; imagens da jornada refeitas em alta; contraste, animações, menu e CLS corrigidos; página 404; teste automatizado com 227 verificações.

## B. Funcionalidades testadas (Playwright, Chromium)
| Fluxo | Resultado |
|---|---|
| Âncoras internas (todas as páginas) | OK, nenhuma quebrada |
| Links internos `.html` | OK, todos respondem 200 |
| Links de WhatsApp | OK, número 55 42 8404-3000 e mensagem correta em cada contexto (encomenda × revenda) |
| Links externos com `rel="noopener"` | OK |
| Menu mobile (abrir, Esc, navegar para revenda) | OK |
| Galeria com imagem ampliada (abrir, seta, Esc, devolver foco) | OK |
| Carrossel de valores, visualizador 360° (botões e teclado) | OK (360° testado com WebGL por software) |
| Formulários, login, APIs, banco de dados | Não existem no projeto |
| **Corrigido:** menu de 7 itens quebrava em duas linhas entre 861 e 1180 px | passa ao menu compacto abaixo de 1180 px |

## C. Identidade visual
- **Removido:** token `--bordeaux` (#8E2233) e as 14 ocorrências: título do hero, palavra de destaque do manifesto, card "Assinatura", card de valor "Bordô", hover de botão, gradientes da barra de progresso e da jornada, aurora, gravura, paleta da seção fixada.
- **Aplicado:** azul institucional do manual (#171C6B) nos destaques; #2B3A9E (derivado, 9,5:1 sobre branco) no card "Assinatura"; a seção fixada agora passa preto café → azul → cobre escuro.
- **Mantido de propósito:** vermelho das cerejas nas fotos e ilustrações (conteúdo real, não cor institucional).
- **Contraste (WCAG AA):** cobre para textos pequenos sobre claro trocado para #8A5A2B (5,9:1); fundos cobre com texto branco para #94622F (5,2:1).
- **Verificação residual:** o teste automatizado confirma que o CSS não contém mais bordô.

## D. Inventário de imagens (`assets/img`, 105 arquivos)
Todas as imagens exibidas foram verificadas: arquivo real × tamanho renderizado em 1440 px (1×) e 390 px (2×), além da inspeção visual das capturas.

| Família | Arquivos | Dimensões | Peso | Onde | Situação |
|---|---|---|---|---|---|
| `bag-front*` | 4 | 554×993, 420×753 | 114 KB | Hero e contato (revenda) · embalagem de frente | Otimizada. Recorte do mockup enviado (9.webp). Fonte limitada a 554 px de largura: nítida em telas comuns, levemente suave em telas retina no hero. **Pendente:** packshot em alta (≥ 1200 px). |
| `bag-34*` | 4 | 609×1046, 420×721 | 141 KB | Bento "Nosso café" e fallback do 360° | Otimizada. Recorte do mockup 6.webp, sombra do chão removida. |
| `pack-front*` | 4 | 630×1041, 420×694 | 145 KB | Contato e hero de revenda | Otimizada. Render oficial 4.webp com transparência. |
| `pack-tilt*` | 4 | 760×879, 480×555 | 136 KB | Seção Sabor · Equilíbrio · Origem | Otimizada. Render oficial 5.webp com transparência. |
| `tex-front*` | 1 | 1108×1986 | 163 KB | Textura do modelo 3D | Otimizada. Frente da embalagem (9.webp) ampliada 2× para a textura WebGL. |
| `feature*` | 10 | 1920×1080, 1440×810, 980×1080 | 743 KB | Nova seção "Alguns cafés despertam, outros permanecem" | Nova. Key visual do manual (imagem 1), 1920 px + recorte vertical para celular. |
| `step-cafeeiro*` | 2 | 1000×1250 | 269 KB | Jornada · 01 O cafeeiro | Substituída (resolução 900→1000 px; antes ampliada 1,3×). Refeita a partir da gravura original em alta (2.jpg, 1555×2000), marfim sobre o azul. |
| `step-fruto*` | 2 | 760×950 | 253 KB | Jornada · 02 O fruto | Substituída (antes ampliada 1,5×). Refeita a partir do detalhe dos frutos da gravura 2.jpg. |
| `step-grao*` | 2 | 560×700 | 34 KB | Jornada · 03 O grão | Recortada; suave em retina. Recorte vertical do key visual. Fonte limitada (560 px). |
| `step-xicara*` | 2 | 640×800 | 140 KB | Jornada · 04 A xícara | Recortada (500→640 px). Recorte maior da ilustração da xícara (016). |
| `detail*` | 6 | 1920×1080, 1600×900, 960×540 | 220 KB | Faixa com zoom (Experiência) | Otimizada. Mockup 7.webp, 1920 px. Suave em telas retina acima de 1440 px. |
| `frame*` | 4 | 1080×1080, 600×600 | 253 KB | Bento · foto da embalagem na moldura | Otimizada. Mockup 8.webp. |
| `essence-engraving*` | 4 | 960×1080, 600×675 | 391 KB | Nossa essência | Otimizada. Ilustração azul do manual. **Pendente:** foto autêntica da família ou da produção. |
| `exp-*` | 4 | 800×514, 800×576, 680×850 | 148 KB | Cards da Experiência | Otimizadas. Key visuals do manual; o card "Aroma" trocou para outro recorte, sem repetir a nova seção de destaque. |
| `g-*` | 48 | 1600×900, 800×450 | 3491 KB | Galeria "A marca em aplicações" | Otimizadas. 12 aplicações do manual, 800 e 1600 px. |
| `branch-mask*` | 2 | 651×939 | 275 KB | Gravura decorativa (máscara CSS) | Otimizada. Gerada da gravura 2.jpg. |
| `pattern-mask*` | 1 | 500×500 | 8 KB | Padrão gráfico da marca (máscara CSS) | Otimizada. Gerado do padrão 1.png. |
| `og-image*` | 1 | 1200×630 | 88 KB | Compartilhamento (Open Graph) | Otimizada. Key visual 1200×630. |

**Pendentes por limitação da fonte** (não há original maior no projeto): `bag-front` e `step-grao` ficam levemente suaves em telas retina; `detail` acima de 1440 px retina. Não usei ampliação por IA para não alterar a embalagem real.

## E. Fontes e licenças
- Todas as imagens vêm do manual de marca e dos mockups enviados pelo cliente; nenhuma imagem de banco foi adicionada.
- **Decisão pendente:** o briefing sugere fotos de café e campo do Adobe Stock Free, mas você pediu para voltar à versão sem banco de imagens. Os vídeos licenciados antes foram removidos (as licenças gratuitas continuam na conta Adobe).
- Fontes Cormorant e Sora (SIL Open Font License), servidas localmente. Three.js r170 (licença MIT).

## F. Origem da produção
- Faixa "A origem do nosso café está em Araguari, Minas Gerais." na home, texto da essência, chip do hero, faixa de pilares, rodapé, meta description e dados estruturados.
- Página de revenda: bloco "Produção em Araguari, Minas Gerais."
- Sem afirmar exclusividade de cultivo, fazendas, altitude, certificações ou métodos.

## G. Área comercial — `revendedor.html`
- Item "Seja um revendedor" no menu desktop, no menu mobile e no rodapé de todas as páginas.
- Seções: hero ("Leve o nosso café para a sua loja." + QUERO REVENDER), públicos (6 tipos de estabelecimento), origem e produto, três passos, chamada final (FALAR COM A EQUIPE COMERCIAL).
- WhatsApp com a mensagem "Olá! Tenho interesse em comercializar o café na minha loja e gostaria de conhecer as condições para me tornar revendedor." (codificada e testada).
- Não há margens, preços, pedido mínimo nem prazos (não foram informados).

## H. CTA de encomenda
"Solicitar uma encomenda" → "Solicitar encomenda" em todas as ocorrências (botão do topo, menu mobile, botão flutuante, rótulos acessíveis) nas 4 páginas. Destino e mensagem do WhatsApp preservados. O teste falha se o texto antigo voltar.

## I. UX/UI e animações
- Removidos efeitos de tendência: aurora em gradiente, vidro (desfoque), luz que segue o cursor, botões magnéticos, faixa em loop contínuo.
- Tempos padronizados: microinterações em 200 ms; entradas em 550–600 ms (antes 0,9–1,4 s); escalonamento de 30 ms nos títulos.
- Nova seção de destaque com o key visual (zoom suave ligado à rolagem e fio cobre que cresce).
- `prefers-reduced-motion` respeitado em tudo.

## J. Performance (laboratório local, Chromium sem limitação de rede/CPU; valores variam entre execuções)
| Página | LCP antes (desk/mob) | LCP depois | CLS antes (desk/mob) | CLS depois |
|---|---|---|---|---|
| Home | 948 / 1564 ms | 192–1108 / 816–1016 ms | 0,054 / 0 | 0,021 / 0 |
| Revendedor | — | 824 / 832 ms | — | 0,001 / 0 |

- O CLS vinha da divisão em palavras do título do hero após o carregamento; o título inicial deixou de ser dividido. O 0,02 restante vem da troca de fonte.
- INP não foi medido (exige interação real); não há dados de usuários reais.
- WebP/AVIF com `srcset`/`sizes`, `loading="lazy"` fora da primeira dobra, `fetchpriority="high"` só na imagem do hero, Three.js só carrega perto da seção 360°.

## K. Responsividade e acessibilidade
- 320, 375, 390, 430, 768, 1024, 1280, 1440 e 1920 px: sem rolagem horizontal nas 4 páginas (teste automatizado).
- Hierarquia de títulos (um `h1` por página), textos alternativos descritivos, `alt=""` nas imagens decorativas, foco visível, menu e galeria operáveis por teclado, diálogo nativo na galeria.

## L. Qualidade técnica
- Sem build, lint ou tipagem no projeto (HTML/CSS/JS puro). Sintaxe JS verificada.
- `testes/verificar-site.mjs`: **227 verificações, todas passando**.
- Segurança: site estático, sem segredos, sem `innerHTML`/`eval`, sem armazenamento no navegador, links externos com `noopener`.

## M. Arquivos modificados
- `index.html` — cores, CTA, Araguari, nova seção de assinatura, menu, depoimentos (desativados), imagens da jornada.
- `revendedor.html` (novo), `404.html` (novo), `politica-de-privacidade.html` (cabeçalho e rodapé atualizados).
- `assets/css/styles.css` — tokens, contraste, revendedor, assinatura, menu responsivo, animações.
- `assets/js/main.js` — paleta da seção fixada, sem efeitos magnéticos, correção de CLS, breakpoint do menu.
- `assets/img/` — imagens da jornada refeitas, imagens da nova seção, card "Aroma".
- `sitemap.xml`, `testes/verificar-site.mjs`, `README.md`, `AUDITORIA.md`.

## N. Pendências
| Prioridade | Item | Por quê |
|---|---|---|
| P2 | Depoimentos de clientes | A seção está pronta, mas desativada (`hidden`). Depoimentos inventados com nomes reais são publicidade enganosa (CDC/CONAR). Precisa de depoimentos reais e autorizados. |
| P2 | Packshots em alta resolução (≥ 1200 px) | Hero e "O grão" ficam levemente suaves em telas retina. |
| P2 | Fotos reais de Araguari / produção / família | Hoje a origem é comunicada só por texto e ilustração. |
| P3 | Domínio definitivo | canonical, Open Graph e sitemap usam `familianardi.com.br` provisório. |
| P3 | Confirmar 250 g, perfil sensorial e redes sociais | Blocos marcados com `EDITAR`. |
| P3 | Arte do verso e da lateral para o 360° | O verso está liso e a lateral mostra só a frase. |
| P3 | Decidir sobre fotos de banco (Adobe Stock) | Você pediu para voltar à versão sem banco; o briefing sugere usar. |

## Atualização posterior (mesma data)
- Seção da key visual reescrita como **"Para os momentos que ficam."**, com a frase da marca no texto corrido.
- Seção **Avaliações** visível, com convite para enviar avaliação pelo WhatsApp. Os cartões com os 9 nomes seguem ocultos até haver depoimentos reais e autorizados.
- Removida a seção "A marca em aplicações" e a imagem ampliada (a pedido).
- "Do cafeeiro à xícara" agora usa fotos reais (quadros em 1080 px de vídeos do Adobe Stock licenciados; IDs no README).
- Modelo 3D: a lateral passou a usar a arte real da embalagem (frase + bloco de texto), retificada do render oficial `4.webp`.
