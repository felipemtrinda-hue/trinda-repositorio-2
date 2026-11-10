# Central Financeira

Painel pessoal de finanças: entradas, contas a pagar e dívidas parceladas.

- `index.html` — versão standalone: abra no navegador; os dados ficam salvos neste navegador (localStorage).
- `painel.html` — fonte publicada como Artifact no claude.ai (dados salvos na conta, privados, sincronizados entre aparelhos).

Para atualizar o `index.html` depois de editar o `painel.html`, envolva o conteúdo com `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" ...></head><body>` … `</body></html>`.
