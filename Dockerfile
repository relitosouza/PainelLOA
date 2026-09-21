# Base image
FROM node:22-slim AS base

# Stage 1: Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Stage 2: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Gerar Prisma Client e compilar Next.js
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
# A imagem oficial do PostgreSQL já inclui pg_dump 16, compatível com o banco da VPS.
# Isso evita depender de apt-get durante o build, cuja saída de rede está bloqueada na VPS.
FROM postgres:16-bookworm AS runner
COPY --from=base /usr/local /usr/local
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Instala prisma globalmente no runner para permitir comandos como `prisma db push`
RUN npm install -g prisma@^6.10.0

# Cria diretório de backups com permissões para o usuário da aplicação
RUN mkdir -p /app/backups && chown -R nextjs:nodejs /app/backups && chmod 777 /app/backups

# Copia arquivos públicos e standalone compilados
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --chown=nextjs:nodejs scripts ./scripts
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh ./scripts/*.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
