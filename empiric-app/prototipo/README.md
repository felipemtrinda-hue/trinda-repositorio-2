# Protótipo navegável (artefato do claude.ai)

`prototipo-empiric.html` é a página publicada como artefato. Com a capacidade `db`, os dados
(imóveis, boletos, chamados, avisos, indicações) ficam num banco compartilhado entre quem
abre o link logado no claude.ai — o que um faz aparece ao vivo para os outros. Sem acesso ao
banco, a página cai no modo local (dados só no navegador).

`dados-demo.json` são os 71 registros fictícios carregados no banco.

**Não cadastre dados reais de clientes no protótipo**: não há login por pessoa nem isolamento
por perfil — qualquer pessoa com acesso escolhe ser inquilino, proprietário ou equipe.
Dados reais vão apenas para o sistema (`empiric-app`), que tem RLS e LGPD.

## Fotos das personas fictícias

| Persona | Papel | Arquivo do protótipo | Cópia para o app (demo) |
|---|---|---|---|
| Mariana Souza (`T1`) | Inquilina | `prototipo/fotos/mariana.jpg` (400×400) | `public/demo/avatars/mariana.jpg` (256×256) |
| Carlos Menezes (`O1`) | Proprietário | `prototipo/fotos/carlos.jpg` (400×400) | `public/demo/avatars/carlos.jpg` (256×256) |

Fotos de banco de imagens livres de direitos autorais, fornecidas pelo Felipe e recortadas em quadrado
centrado no rosto. No HTML publicado elas entram embutidas (128×128, base64) pela função `avatar()`;
as demais pessoas continuam com as iniciais. Use só nas contas de demonstração — nunca em cadastro real.
