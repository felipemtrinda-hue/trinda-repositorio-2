# Proposta de identidade visual — Portal Empiric Imob

> **Fonte:** o site oficial (empiricimob.com.br) não pôde ser acessado do ambiente de desenvolvimento
> (bloqueio de rede). A proposta parte da **logo oficial enviada** (versões vertical e horizontal)
> e do guia editorial `DESIGN.md` de referência. **Validar com o site antes da Etapa 2**:
> fontes institucionais, tom de voz, fotos e dados de contato.

## Conceito

**"Papel creme e vinho."** Um portal com cara de publicação bem editada, não de sistema
genérico: fundo creme quente, muito respiro, títulos serifados com uma palavra em itálico
(a assinatura) e o bordô da Empiric carregando peso e ação. Transmite solidez (mercado
imobiliário) sem frieza corporativa.

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `vinho` | `#580d26` | Cor da marca (amostrada da logo). Menu lateral, cards escuros, títulos de destaque |
| `vinho-deep` | `#3d0919` | Hover sobre vinho |
| `bordo` | `#8c1c3e` | **Ação**: botões, links ativos, foco. Contraste 8,6:1 com branco |
| `rose-mist` | `#f6e9ec` | Badges, ícones em círculo, realces |
| `canvas` | `#f9f8f6` | Fundo de página |
| `paper` | `#ffffff` | Cards e campos |
| `cream` | `#f0e9e1` | **Toda** linha divisória (nada de cinza frio) |
| `charcoal` | `#171417` | Texto principal |
| `stone` | `#6f6a6c` | Texto auxiliar (escurecido do guia para passar AA) |

Semânticas (pago, vencido, pendente) usam verdes/âmbar/vermelho dessaturados para
não competir com o vinho.

**Adaptação do guia:** o `DESIGN.md` usa dois azuis (navy editorial + cobalto de ação).
Mantivemos o *sistema de dois tons* trocando o par por **vinho (peso) + bordô (ação)**,
preservando a identidade da Empiric.

## Tipografia

| Papel | Fonte | Observação |
|---|---|---|
| Display (títulos de página) | **Instrument Serif** 400 + itálico | Substituta livre de GT Super/Tiempos. Uma expressão em itálico bordô por título |
| Subtítulos / números | **Inter Tight** 500–600 | Tracking negativo em tamanhos grandes |
| Texto, botões, formulários | **Inter** 400–500 | Linha 1.6 para leitura confortável |

## Formas e componentes

- Cards: raio 16px, borda creme 1px, sombra vinho a 6%.
- Botões e chips: pílula (raio 100px), sem sombra — a cor é a elevação.
- Três variações de card de destaque: **vinho** (principal), **papel** (neutro) e **borda bordô** (o diferencial).
- Menu lateral vinho no desktop (recolhível); barra inferior flutuante + folha "Mais" no celular.
- WhatsApp: botão verde fixo, só na área do inquilino, com número vindo das Configurações.
- Movimento: entrada em cascata dos cards (≤ 200ms de atraso), fade entre páginas, skeleton com brilho;
  tudo desligado em `prefers-reduced-motion`.

## Tom de voz

Cordial e direto, em segunda pessoa ("Seu boleto vence em 10 dias"), sem jargão técnico —
o público inclui pessoas pouco familiarizadas com tecnologia.

## Pendências para validar com o site oficial

- [ ] Fonte institucional usada no site (se houver), para títulos
- [ ] Fotografia: estilo das fotos de imóveis (luz, enquadramento)
- [ ] CRECI, endereço, telefones, WhatsApp oficial, e-mail e redes → cadastrar em **Configurações** (nunca no código)
- [ ] Slogan/posicionamento oficial para a tela de login
