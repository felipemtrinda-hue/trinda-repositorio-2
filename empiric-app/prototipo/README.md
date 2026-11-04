# Protótipo navegável (artefato do claude.ai)

`prototipo-empiric.html` é a página publicada como artefato. Com a capacidade `db`, os dados
(imóveis, boletos, chamados, avisos, indicações) ficam num banco compartilhado entre quem
abre o link logado no claude.ai — o que um faz aparece ao vivo para os outros. Sem acesso ao
banco, a página cai no modo local (dados só no navegador).

`dados-demo.json` são os 71 registros fictícios carregados no banco.

**Não cadastre dados reais de clientes no protótipo**: não há login por pessoa nem isolamento
por perfil — qualquer pessoa com acesso escolhe ser inquilino, proprietário ou equipe.
Dados reais vão apenas para o sistema (`empiric-app`), que tem RLS e LGPD.
