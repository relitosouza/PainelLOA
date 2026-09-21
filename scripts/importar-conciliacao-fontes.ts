// Cadastra o quadro de conciliação (planilha "BATE FONTE") na tabela ConciliacaoFonte.
//
// Do CSV aproveitamos a RECEITA, a ordem das linhas e o agrupamento em blocos — as colunas DESPESA,
// DIFERENÇA e DIFERENÇAS são recalculadas no painel a cada edição e por isso não são importadas.
// Os blocos são delimitados pelas linhas em branco da planilha.
//
// Uso (simulação):  npx tsx scripts/importar-conciliacao-fontes.ts backups/bate-fonte-2027.csv
// Uso (grava):      npx tsx scripts/importar-conciliacao-fontes.ts backups/bate-fonte-2027.csv --aplicar [--exercicio=2027]
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const APLICAR = args.includes("--aplicar");
const EXERCICIO = Number(args.find((a) => a.startsWith("--exercicio="))?.split("=")[1] ?? 2027);
const ARQUIVO = args.find((a) => !a.startsWith("--"));
const db = new PrismaClient();

const lerValor = (texto: string) => {
  const limpo = (texto ?? "").trim();
  if (!limpo || limpo === "-") return 0;
  const negativo = limpo.startsWith("-");
  const numero = Number(limpo.replace(/^-/, "").replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(numero)) throw new Error(`Valor inválido: "${texto}"`);
  return negativo ? -numero : numero;
};

const formatar = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function main() {
  if (!ARQUIVO) throw new Error("Informe o caminho do CSV.");
  console.log(`== Conciliação de fontes ${EXERCICIO} a partir de ${path.basename(ARQUIVO)} (${APLICAR ? "APLICANDO" : "SIMULAÇÃO"}) ==\n`);

  const linhas = fs.readFileSync(ARQUIVO, "utf8").replace(/^﻿/, "").split(/\r?\n/);
  const registros: Array<{ exercicio: number; ug: string; fa: string; conf: string; receita: number; bloco: number; ordem: number }> = [];
  const corrigidos: string[] = [];
  const vistos = new Set<string>();
  let bloco = 1;
  let ordem = 0;
  let cabecalhoVisto = false;

  for (let i = 0; i < linhas.length; i++) {
    const campos = (linhas[i] ?? "").split(";").map((c) => c.trim());
    const [ug, fa, confCsv, receitaTexto] = campos;

    // O cabeçalho ("UG;F.A;CONF;...") vem depois das linhas de título e total.
    if (!cabecalhoVisto) {
      if (ug === "UG" && fa === "F.A") cabecalhoVisto = true;
      continue;
    }

    // Linha sem UG/F.A é o separador de bloco da planilha.
    if (!ug || !fa) {
      if (registros.length > 0 && ordem > 0) {
        bloco++;
        ordem = 0;
      }
      continue;
    }

    // "93.100.02901" tem um zero a mais no último grupo; o CONF da própria planilha ("PMO.93.100.2901")
    // mostra a forma correta. Só corrigimos quando o zero extra é o que sobra.
    let faNormalizada = fa;
    if (/^\d{2}\.\d{3}\.0\d{4}$/.test(fa)) {
      faNormalizada = fa.replace(/\.0(\d{4})$/, ".$1");
      corrigidos.push(`linha ${i + 1}: F.A "${fa}" -> "${faNormalizada}"`);
    }
    if (!/^\d{2}\.\d{3}\.\d{4}$/.test(faNormalizada)) throw new Error(`Linha ${i + 1}: F.A fora do padrão NN.NNN.NNNN: "${fa}"`);

    // O CONF do CSV tem erros de digitação (um repetido da linha de cima, um com dígito a mais).
    // A chave verdadeira é UG + F.A, então recalculamos e registramos a correção.
    const conf = `${ug}.${fa}`;
    if (confCsv && confCsv !== conf) corrigidos.push(`linha ${i + 1}: "${confCsv}" -> "${conf}"`);

    if (vistos.has(conf)) throw new Error(`Linha ${i + 1}: CONF repetido no CSV: ${conf}`);
    vistos.add(conf);

    registros.push({ exercicio: EXERCICIO, ug, fa, conf, receita: lerValor(receitaTexto ?? ""), bloco, ordem: ++ordem });
  }

  const totalReceita = registros.reduce((soma, r) => soma + Math.round(r.receita * 100), 0) / 100;
  const blocos = new Set(registros.map((r) => r.bloco)).size;
  console.log(`Linhas: ${registros.length} · blocos: ${blocos}`);
  console.log(`Receita cadastrada: R$ ${formatar(totalReceita)}`);
  console.log(`Por UG: ${[...new Set(registros.map((r) => r.ug))].map((ug) => `${ug}=${registros.filter((r) => r.ug === ug).length}`).join(" · ")}`);
  if (corrigidos.length > 0) console.log(`\nCONF corrigidos (${corrigidos.length}):\n  ${corrigidos.join("\n  ")}`);

  const existentes = await db.conciliacaoFonte.count({ where: { exercicio: EXERCICIO } });
  console.log(`\nJá cadastrado no banco: ${existentes} linhas (serão substituídas).`);

  if (!APLICAR) {
    console.log("\n[simulação] Nada foi gravado. Para gravar: --aplicar");
    return;
  }

  await db.$transaction([
    db.conciliacaoFonte.deleteMany({ where: { exercicio: EXERCICIO } }),
    db.conciliacaoFonte.createMany({ data: registros }),
  ]);
  const gravado = await db.conciliacaoFonte.aggregate({ where: { exercicio: EXERCICIO }, _count: { _all: true }, _sum: { receita: true } });
  console.log(`✓ Gravado: ${gravado._count._all} linhas · receita R$ ${formatar(Number(gravado._sum.receita))}`);
}

main()
  .catch((erro) => {
    console.error("✗", erro instanceof Error ? erro.message : erro);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
