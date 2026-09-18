// Religa os dados salvos da Análise LOA aos IDs novos das linhas depois da correção dos vínculos
// em public/loa_new.xlsx. Ver src/lib/migracao-ids-vinculos.ts.
//
// Uso (simulação, não grava nada):   npx tsx scripts/migrar-ids-vinculos.ts
// Uso (grava, com backup antes):     npx tsx scripts/migrar-ids-vinculos.ts --aplicar
//
// Pode ser executado mais de uma vez: só converte o que ainda estiver no formato antigo.
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { PrismaClient, type Prisma } from "@prisma/client";
import { buildAnaliseLoaItems } from "@/lib/loa-analise-items";
import { buildNomenclaturaMap } from "@/lib/nomenclatura-map";
import { converterIdVinculo, migrarIdsNoValor } from "@/lib/migracao-ids-vinculos";

const APLICAR = process.argv.includes("--aplicar");
const db = new PrismaClient();
const serializar = (valor: unknown) => JSON.stringify(valor, (_chave, v) => (typeof v === "bigint" ? String(v) : v), 1);

async function main() {
  console.log(`== Migração de IDs da Análise LOA (${APLICAR ? "APLICANDO" : "SIMULAÇÃO"}) ==\n`);

  // 1. A planilha precisa estar com os vínculos já corrigidos; senão os IDs novos não existem.
  const arquivo = path.join(process.cwd(), "public", "loa_new.xlsx");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(XLSX.read(fs.readFileSync(arquivo)).Sheets[XLSX.read(fs.readFileSync(arquivo)).SheetNames[0]], { header: 1 });
  const headers = (rows[0] as unknown[]).map((h) => String(h ?? "").trim().toLowerCase());
  const colPeca = headers.lastIndexOf("peça orçamentária");
  const colVinculo = headers.lastIndexOf("vínculo");
  const semVinculo = rows.slice(1).filter((r) => {
    const peca = String(r[colPeca] ?? "").trim().toUpperCase();
    return (peca === "LOA" || peca === "LDO") && !/^\d{2}\.\d{3}\.\d{4}$/.test(String(r[colVinculo] ?? "").trim());
  }).length;
  if (semVinculo > 0) {
    console.error(`✗ A planilha ainda tem ${semVinculo} linhas com vínculo fora do padrão NN.NNN.NNNN.`);
    console.error("  Faça o deploy da planilha corrigida (public/loa_new.xlsx) antes de migrar.");
    process.exit(1);
  }

  // 2. IDs reais das linhas, montados exatamente como a tela monta.
  const nomenclaturas = await db.nomenclaturaDespesa.findMany({ select: { codigo: true, codigoFormatado: true, descricao: true } });
  const idsReais = new Set(buildAnaliseLoaItems(rows, buildNomenclaturaMap(nomenclaturas)).map((item) => item.id));
  console.log(`Planilha: ${idsReais.size} linhas, todas com vínculo no padrão.\n`);

  // 3. Configurações do painel.
  const configs = await db.painelConfig.findMany({ where: { chave: { startsWith: "painel_loa" } } });
  const atualizacoes: Prisma.PrismaPromise<unknown>[] = [];
  const backup: Record<string, unknown> = {};
  let total = 0;
  const semLinha = new Set<string>();
  for (const config of configs) {
    const { valor, convertidos, colisoes } = migrarIdsNoValor(config.valor);
    if (!convertidos.length) continue;
    total += convertidos.length;
    convertidos.filter((id) => !idsReais.has(id)).forEach((id) => semLinha.add(id));
    console.log(`${config.chave.padEnd(36)} ${String(convertidos.length).padStart(5)} IDs convertidos · ${colisoes.length} colisões`);
    backup[`painelConfig:${config.chave}`] = config.valor;
    atualizacoes.push(db.painelConfig.update({ where: { chave: config.chave }, data: { valor: valor as Prisma.InputJsonValue } }));
  }

  // 4. Histórico de alterações e de exclusões (dotacaoId).
  const alteracoes = (await db.alteracaoOrcamentaria.findMany()).filter((a) => a.dotacaoId && converterIdVinculo(a.dotacaoId));
  const exclusoes = (await db.exclusaoDotacao.findMany()).filter((e) => converterIdVinculo(e.dotacaoId));
  if (alteracoes.length) backup.alteracaoOrcamentaria = alteracoes;
  if (exclusoes.length) backup.exclusaoDotacao = exclusoes;
  alteracoes.forEach((a) => atualizacoes.push(db.alteracaoOrcamentaria.update({ where: { id: a.id }, data: { dotacaoId: converterIdVinculo(a.dotacaoId!)! } })));
  exclusoes.forEach((e) => atualizacoes.push(db.exclusaoDotacao.update({
    where: { id: e.id },
    data: {
      dotacaoId: converterIdVinculo(e.dotacaoId)!,
      dadosOriginais: e.dadosOriginais ? (migrarIdsNoValor(e.dadosOriginais).valor as Prisma.InputJsonValue) : undefined,
    },
  })));
  console.log(`${"histórico de alterações".padEnd(36)} ${String(alteracoes.length).padStart(5)} registros`);
  console.log(`${"histórico de exclusões".padEnd(36)} ${String(exclusoes.length).padStart(5)} registros`);

  console.log(`\nTotal: ${total} IDs em configurações + ${alteracoes.length + exclusoes.length} registros de histórico.`);
  if (semLinha.size) {
    console.log(`⚠ ${semLinha.size} IDs novos não correspondem a nenhuma linha da planilha (exemplos):`);
    [...semLinha].slice(0, 5).forEach((id) => console.log("   ", id));
  } else if (total) {
    console.log("✓ Todos os IDs novos correspondem a linhas da planilha.");
  }

  if (!atualizacoes.length) {
    console.log("\nNada a migrar: os dados já estão no formato novo.");
    return;
  }
  if (!APLICAR) {
    console.log("\n[simulação] Nada foi gravado. Para gravar: --aplicar");
    return;
  }

  fs.mkdirSync("backups", { recursive: true });
  const arquivoBackup = path.join("backups", `antes-migracao-ids-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(arquivoBackup, serializar(backup));
  console.log(`\nBackup do que será alterado: ${arquivoBackup}`);
  await db.$transaction(atualizacoes);
  console.log(`✓ Gravado: ${atualizacoes.length} atualizações numa única transação.`);
}

main()
  .catch((erro) => {
    console.error("✗ Falha na migração (nada foi gravado se a falha foi antes da transação):", erro);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
