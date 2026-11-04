# Identidade visual — Portal Empiric Imob (v2 · "Clean")

> **Decisão (04/11/2026):** o site atual da Empiric não serve de padrão visual. O portal segue uma
> linguagem nova, **branca, limpa e moderna, no estilo dos produtos Apple**, a partir da estrutura do
> `DESIGN.md` e da referência mobile (card escuro de destaque, cards suaves, barra inferior
> flutuante com ação central). Da marca original ficam **a logo, sem alterações, e o bordô**.
>
> A v1 ("papel creme + serifa itálica") foi substituída.

## Princípios

1. **Branco predominante.** O fundo é branco puro. Os cards se separam por sombra difusa, sem bordas pesadas.
2. **Uma só cor de marca.** O bordô aparece só onde importa: a ação principal, o item ativo e um card de destaque por tela.
3. **Tipografia jovem e geométrica.** Títulos grandes e compactos, com a palavra de destaque em bordô.
4. **Toque generoso.** Raios grandes (20–32px), botões em pílula e áreas de toque de 44px ou mais.

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `vinho` | `#580d26` | Cor da logo; base do gradiente dos cards de destaque e do item ativo |
| gradiente vinho | `#74163a → #580d26 → #2e0616` | Card principal (próxima fatura, imóveis), painel do login |
| `bordo` | `#8c1c3e` | **Ação**: botões, botão central do celular, links, foco. Contraste 8,6:1 com branco |
| `rose-mist` | `#f8eef1` | Fundo de ícones e badges da marca |
| `canvas` / `paper` | `#ffffff` | Fundo de página e cards |
| `mist` | `#f5f5f7` | Campos, chips, trilhas de gráfico, blocos internos |
| `cream` | `#ececf0` | Linhas divisórias |
| `charcoal` | `#1d1d1f` | Texto principal |
| `stone` | `#6e6e73` | Texto secundário (passa AA) |

As cores semânticas (pago, vencido, em análise) usam verde, âmbar, vermelho e azul suaves sobre fundo claro.

## Tipografia

| Papel | Fonte | Peso | Observação |
|---|---|---|---|
| Títulos e números | **Plus Jakarta Sans** | 600–800 | Tracking −0,04em; destaque em gradiente bordô |
| Texto, botões e formulários | **Inter** | 400–600 | Linha 1,55 |

As duas fontes são gratuitas (Google Fonts) e carregadas pelo `next/font`, sem custo de licença.

## Componentes-chave

- **Card de destaque**: gradiente vinho, brilho difuso e sombra bordô. É o único elemento escuro de cada tela.
- **Card padrão**: branco, raio 24px, anel de 4% e sombra `0 8px 28px rgba(0,0,0,.06)`.
- **Card de realce**: branco com anel bordô de 1,5px. Serve para o indicador que pede atenção (ex.: chamados abertos).
- **Menu lateral (desktop)**: branco, com logo horizontal; o item ativo é uma pílula em gradiente vinho; o cartão do usuário fica no rodapé; pode ser recolhido.
- **Barra inferior (celular)**: flutuante, em vidro fosco e só com ícones. O **botão central bordô** leva à ação principal do perfil:
  - inquilino → abrir chamado;
  - proprietário → recibos;
  - admin → buscar imóvel.
- **Campos**: fundo `mist` sem borda; ao focar, ficam brancos com halo rosé.
- **Cabeçalho**: em vidro fosco (blur), com avatar, saudação e sino de notificações.
- **Movimento**: cards entram em cascata (até 200ms) e as páginas trocam com fade; tudo isso é desligado em `prefers-reduced-motion`.

## Tom de voz

Cordial e direto, em segunda pessoa ("Seu boleto vence em 10 dias"), sem jargão técnico.

## Dados institucionais

CRECI, endereço, telefones, WhatsApp oficial, e-mail e redes ficam em **Configurações** (tabela
`settings`), nunca fixos no código. Ainda precisam ser informados pela Empiric.
