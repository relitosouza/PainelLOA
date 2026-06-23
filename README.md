# Visualizador da LOA

Painel executivo para importar, persistir e analisar a Lei Orçamentária Anual com Next.js, Prisma e PostgreSQL.

## Executar localmente

1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`.
2. Crie as tabelas com `npm run db:push`.
3. Inicie a aplicação com `npm run dev`.
4. Acesse `http://localhost:3000`.

## Verificação

```text
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Identidade visual

As cores provisórias ficam nas variáveis do início de `src/app/globals.css`. Substitua-as pela paleta oficial quando os códigos HEX e o brasão da Prefeitura estiverem disponíveis.