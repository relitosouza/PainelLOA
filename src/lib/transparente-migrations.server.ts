import { db } from "@/lib/db";

let tabelasGarantidas = false;

const DDL_COMMANDS = [
  `CREATE TABLE IF NOT EXISTS "TransparenteConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "exercicio" TEXT NOT NULL DEFAULT '2027',
    "totalGeral" DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "totalInvestimentos" DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "totalSecretarias" INTEGER NOT NULL DEFAULT 0,
    "tituloHero" TEXT,
    "subtituloHero" TEXT,
    "notaInformativa" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "TransparenteArea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "label" TEXT NOT NULL,
    "valor" DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "percentual" DECIMAL(6, 2) NOT NULL DEFAULT 0,
    "icone" TEXT NOT NULL DEFAULT 'category',
    "corTexto" TEXT NOT NULL DEFAULT 'text-primary',
    "corFundo" TEXT NOT NULL DEFAULT 'bg-primary-100',
    "corBarra" TEXT NOT NULL DEFAULT '#3B82F6',
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE INDEX IF NOT EXISTS "TransparenteArea_ordem_idx" ON "TransparenteArea"("ordem")`,

  `CREATE TABLE IF NOT EXISTS "TransparenteInvestimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "secretaria" TEXT NOT NULL,
    "valor" DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "destaque" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE INDEX IF NOT EXISTS "TransparenteInvestimento_ordem_idx" ON "TransparenteInvestimento"("ordem")`,

  `CREATE TABLE IF NOT EXISTS "TransparenteSecretaria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL UNIQUE,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "percentual" DECIMAL(6, 2) NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE INDEX IF NOT EXISTS "TransparenteSecretaria_ordem_idx" ON "TransparenteSecretaria"("ordem")`,
];

/**
 * Garante que as tabelas do Orçamento Transparente existam no banco de dados.
 * Executa comando por comando individualmente para compatibilidade total com
 * prepared statements do driver PostgreSQL do Prisma.
 */
export async function assegurarTabelasTransparente(): Promise<void> {
  if (tabelasGarantidas) return;

  for (const cmd of DDL_COMMANDS) {
    try {
      await db.$executeRawUnsafe(cmd);
    } catch (error) {
      console.error("Erro ao executar DDL de tabela do Transparente:", error);
    }
  }

  tabelasGarantidas = true;
}
