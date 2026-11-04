# Auditoria visual e responsiva das telas

Abre cada tela real do app, nos 3 perfis e em 4 tamanhos (monitor, notebook, tablet, celular),
contra um **backend simulado** com dados fictícios. Aponta telas de erro, rolagem lateral,
elementos fora da tela, alvos de toque < 40px e erros de console.

Não substitui os testes de permissão do banco (`npm run db:test`), que rodam em Postgres real.

```bash
node tools/auditoria/mock-supabase.js &
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=mock npm run build
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=mock npx next start -p 3200 &
node tools/auditoria/auditar-telas.js          # relatório em JSON
node tools/auditoria/auditar-telas.js shots    # + capturas em tools/auditoria/capturas/
```

Depois, rode `npm run build` de novo sem as variáveis para voltar ao build normal.
