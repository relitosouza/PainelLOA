// Importa a receita da LOA a partir do CSV da SF (colunas: Apelido, Vínculo, Descrição Vínculo, LOA <ano>, UG),
// substituindo a receita do exercício na tabela LoaReceita.
//
// Diferente do importador da tela, mantém os valores negativos (deduções do Fundeb) e as linhas sem valor,
// para o total bater com o do CSV.
//
// Uso (simulação):  npx tsx scripts/importar-receita-loa-csv.ts "caminho/Receita 2027.csv"
// Uso (grava):      npx tsx scripts/importar-receita-loa-csv.ts "caminho/Receita 2027.csv" --aplicar [--exercicio=2027]
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const APLICAR = args.includes("--aplicar");
const EXERCICIO = Number(args.find((a) => a.startsWith("--exercicio="))?.split("=")[1] ?? 2027);
const ARQUIVO = args.find((a) => !a.startsWith("--"));
const db = new PrismaClient();

const lerLinha = (linha: string) => {
  const campos: string[] = [];
  let atual = "";
  let aspas = false;
  for (const c of linha) {
    if (c === '"') aspas = !aspas;
    else if (c === "," && !aspas) { campos.push(atual); atual = ""; }
    else atual += c;
  }
  campos.push(atual);
  return campos.map((campo) => campo.trim());
};

// Valores no formato brasileiro: " 20.484.000,00 ", "-36.828.000,00 ", "  -    " (zero) ou vazio.
const lerValor = (texto: string) => {
  const limpo = texto.trim();
  if (!limpo || limpo === "-") return 0;
  const negativo = limpo.startsWith("-");
  const numero = Number(limpo.replace(/^-/, "").replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(numero)) throw new Error(`Valor inválido: "${texto}"`);
  return negativo ? -numero : numero;
};

async function main() {
  if (!ARQUIVO) throw new Error("Informe o caminho do CSV.");
  console.log(`== Receita LOA ${EXERCICIO} a partir de ${path.basename(ARQUIVO)} (${APLICAR ? "APLICANDO" : "SIMULAÇÃO"}) ==\n`);

  const linhas = fs.readFileSync(ARQUIVO, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  let totalInformado: number | null = null;
  const registros = [];
  for (let i = 1; i < linhas.length; i++) {
    const [apelido, vinculo, descricao, valorTexto, ug] = lerLinha(linhas[i]);
    if (!vinculo) {
      // Linha de total geral (sem vínculo).
      if (valorTexto) totalInformado = lerValor(valorTexto);
      continue;
    }
    if (!/^\d{2}\.\d{3}\.\d{4}$/.test(vinculo)) throw new Error(`Linha ${i + 1}: vínculo fora do padrão NN.NNN.NNNN: "${vinculo}"`);
    const valor = lerValor(valorTexto ?? "");
    registros.push({
      exercicio: EXERCICIO,
      codigoReceita: null,
      naturezaReceita: apelido || "N/A",
      descricaoReceita: descricao || "Sem descrição",
      fonteRecurso: vinculo,
      descricaoFonte: descricao || null,
      orgaoUnidade: ug || null,
      valor,
      linhaOrigem: i + 1,
      situacaoValidacao: valor === 0 ? "ALERTA" : "VÁLIDO",
      mensagemValidacao: valor === 0 ? `Sem valor previsto na LOA ${EXERCICIO}` : valor < 0 ? "Valor negativo (dedução Fundeb)" : null,
    });
  }

  const centavos = registros.reduce((soma, r) => soma + Math.round(r.valor * 100), 0);
  const total = centavos / 100;
  const formatar = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  console.log(`Registros: ${registros.length} · negativos: ${registros.filter((r) => r.valor < 0).length} · sem valor: ${registros.filter((r) => r.valor === 0).length}`);
  console.log(`Soma das linhas: R$ ${formatar(total)}`);
  if (totalInformado !== null) {
    console.log(`Total do CSV:    R$ ${formatar(totalInformado)}`);
    if (Math.round(totalInformado * 100) !== centavos) throw new Error("A soma das linhas não bate com o total do CSV. Nada foi gravado.");
    console.log("✓ Soma confere com o total do CSV.");
  }

  const existentes = await db.loaReceita.findMany({ where: { exercicio: EXERCICIO } });
  console.log(`\nReceita LOA ${EXERCICIO} hoje no banco: ${existentes.length} registros (serão substituídos).`);
  if (!APLICAR) {
    console.log("\n[simulação] Nada foi gravado. Para gravar: --aplicar");
    return;
  }

  if (existentes.length) {
    fs.mkdirSync("backups", { recursive: true });
    const arquivoBackup = path.join("backups", `antes-receita-loa-${EXERCICIO}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(arquivoBackup, JSON.stringify(existentes, (_k, v) => (typeof v === "bigint" ? String(v) : v), 1));
    console.log(`Backup da receita atual: ${arquivoBackup}`);
  }
  await db.$transaction([
    db.loaReceita.deleteMany({ where: { exercicio: EXERCICIO } }),
    db.loaReceita.createMany({ data: registros }),
  ]);
  const gravado = await db.loaReceita.aggregate({ where: { exercicio: EXERCICIO }, _count: { _all: true }, _sum: { valor: true } });
  console.log(`✓ Gravado: ${gravado._count._all} registros · total R$ ${formatar(Number(gravado._sum.valor))}`);
}

main()
  .catch((erro) => {
    console.error("✗", erro instanceof Error ? erro.message : erro);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
