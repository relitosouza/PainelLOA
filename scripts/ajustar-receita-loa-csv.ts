// Ajusta a receita da LOA aos valores por vínculo do CSV da SF (colunas: UG, F.A, CH, RECEITA),
// PRESERVANDO a quebra por natureza de receita (ISSQN, ICMS, IPTU, FUNDEB...) que alimenta os
// índices constitucionais de 15% Saúde / 25% Educação.
//
// Regras por vínculo (F.A):
//   - soma das linhas do banco já igual ao CSV  -> não mexe;
//   - soma diferente                            -> rateia o novo total entre as linhas existentes,
//                                                  na mesma proporção dos valores atuais;
//   - vínculo sem linha no banco                -> cria uma linha única com o valor do CSV;
//   - UG diferente de PMO (CMO, IPMO, FITO)     -> cria uma linha por vínculo, com a UG na natureza.
//
// Uso (simulação):  npx tsx scripts/ajustar-receita-loa-csv.ts "caminho/Receita 2027.csv"
// Uso (grava):      npx tsx scripts/ajustar-receita-loa-csv.ts "caminho/Receita 2027.csv" --aplicar [--exercicio=2027]
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";

const args = process.argv.slice(2);
const APLICAR = args.includes("--aplicar");
const EXERCICIO = Number(args.find((a) => a.startsWith("--exercicio="))?.split("=")[1] ?? 2027);
const ARQUIVO = args.find((a) => !a.startsWith("--"));
const UG_PREFEITURA = "PMO";
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

/** Valores no formato brasileiro: " 20.484.000,00 ", "-36.828.000,00 " ou " -   " (zero). Devolve centavos. */
const lerCentavos = (texto: string) => {
  const limpo = texto.trim();
  if (!limpo || limpo === "-") return 0;
  const negativo = limpo.startsWith("-");
  const numero = Number(limpo.replace(/^-/, "").replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(numero)) throw new Error(`Valor inválido: "${texto}"`);
  return Math.round(numero * 100) * (negativo ? -1 : 1);
};

const formatar = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Rateia `alvo` entre `valores` na proporção atual, ajustando o resto do arredondamento na maior linha. */
function ratear(valores: number[], alvo: number) {
  const soma = valores.reduce((s, v) => s + v, 0);
  if (soma === 0) throw new Error("não dá para ratear a partir de soma zero");
  const novos = valores.map((v) => Math.round((v * alvo) / soma));
  const resto = alvo - novos.reduce((s, v) => s + v, 0);
  let maior = 0;
  novos.forEach((v, i) => { if (Math.abs(v) > Math.abs(novos[maior])) maior = i; });
  novos[maior] += resto;
  return novos;
}

async function main() {
  if (!ARQUIVO) throw new Error("Informe o caminho do CSV.");
  console.log(`== Ajuste da Receita LOA ${EXERCICIO} por vínculo, a partir de ${path.basename(ARQUIVO)} (${APLICAR ? "APLICANDO" : "SIMULAÇÃO"}) ==\n`);

  // 1. CSV: total por UG + vínculo, na ordem em que aparece.
  const alvos = new Map<string, { ug: string; vinculo: string; centavos: number; linha: number }>();
  const linhas = fs.readFileSync(ARQUIVO, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  linhas.slice(1).forEach((texto, indice) => {
    const [ug, faBruto, ch, valorTexto] = lerLinha(texto);
    if (!ug && !faBruto) return; // linha separadora
    // Algumas linhas têm a F.A digitada errada (ex.: "93.100.02901"); nesses casos vale o que está na coluna CH.
    let vinculo = faBruto.trim();
    if (!/^\d{2}\.\d{3}\.\d{4}$/.test(vinculo)) {
      const doCh = (ch ?? "").trim().replace(/^[A-Z]+\./, "");
      if (!/^\d{2}\.\d{3}\.\d{4}$/.test(doCh)) throw new Error(`Linha ${indice + 2}: vínculo fora do padrão NN.NNN.NNNN: "${faBruto}"`);
      console.log(`  · linha ${indice + 2}: F.A "${faBruto}" corrigida para "${doCh}" pela coluna CH.`);
      vinculo = doCh;
    }
    const chave = `${ug}|${vinculo}`;
    const atual = alvos.get(chave);
    const centavos = lerCentavos(valorTexto ?? "");
    if (atual) atual.centavos += centavos;
    else alvos.set(chave, { ug, vinculo, centavos, linha: indice + 2 });
  });
  const totalCsv = [...alvos.values()].reduce((s, a) => s + a.centavos, 0);
  console.log(`\nCSV: ${alvos.size} vínculos · total R$ ${formatar(totalCsv)}`);

  // 2. Banco: linhas atuais agrupadas por vínculo (só a Prefeitura tem quebra por natureza).
  const existentes = await db.loaReceita.findMany({ where: { exercicio: EXERCICIO }, orderBy: { id: "asc" } });
  const totalAntes = existentes.reduce((s, r) => s + Math.round(Number(r.valor) * 100), 0);
  const porVinculo = new Map<string, typeof existentes>();
  existentes.forEach((r) => {
    const lista = porVinculo.get(r.fonteRecurso) ?? [];
    lista.push(r);
    porVinculo.set(r.fonteRecurso, lista);
  });
  console.log(`Banco: ${existentes.length} linhas em ${porVinculo.size} vínculos · total R$ ${formatar(totalAntes)}\n`);

  // 3. O que muda.
  const atualizacoes: { id: number; de: number; para: number; natureza: string; vinculo: string }[] = [];
  const novos: Prisma.LoaReceitaCreateManyInput[] = [];
  const inalterados: string[] = [];
  const orgaoPrefeitura = existentes.find((r) => r.orgaoUnidade)?.orgaoUnidade ?? null;

  for (const alvo of alvos.values()) {
    const linhasBanco = alvo.ug === UG_PREFEITURA ? porVinculo.get(alvo.vinculo) ?? [] : [];
    const somaAtual = linhasBanco.reduce((s, r) => s + Math.round(Number(r.valor) * 100), 0);
    if (linhasBanco.length && somaAtual === alvo.centavos) {
      inalterados.push(alvo.vinculo);
      continue;
    }
    if (linhasBanco.length && somaAtual !== 0) {
      const rateado = ratear(linhasBanco.map((r) => Math.round(Number(r.valor) * 100)), alvo.centavos);
      linhasBanco.forEach((r, i) => {
        const de = Math.round(Number(r.valor) * 100);
        if (de !== rateado[i]) atualizacoes.push({ id: r.id, de, para: rateado[i], natureza: r.naturezaReceita, vinculo: alvo.vinculo });
      });
      continue;
    }
    novos.push({
      exercicio: EXERCICIO,
      codigoReceita: null,
      naturezaReceita: alvo.ug === UG_PREFEITURA ? "OUTRAS RECEITAS" : alvo.ug,
      descricaoReceita: `${alvo.ug} - vínculo ${alvo.vinculo}`,
      fonteRecurso: alvo.vinculo,
      descricaoFonte: null,
      orgaoUnidade: alvo.ug === UG_PREFEITURA ? orgaoPrefeitura : alvo.ug,
      valor: alvo.centavos / 100,
      linhaOrigem: alvo.linha,
      situacaoValidacao: alvo.centavos === 0 ? "ALERTA" : "VÁLIDO",
      mensagemValidacao: alvo.centavos === 0 ? `Sem valor previsto na LOA ${EXERCICIO}` : alvo.centavos < 0 ? "Valor negativo (dedução Fundeb)" : null,
    });
  }

  // Vínculos que estão no banco e não no CSV: ficam como estão, mas precisam aparecer no relatório.
  const vinculosCsvPmo = new Set([...alvos.values()].filter((a) => a.ug === UG_PREFEITURA).map((a) => a.vinculo));
  const soNoBanco = [...porVinculo.keys()].filter((v) => !vinculosCsvPmo.has(v));

  console.log(`Vínculos sem mudança: ${inalterados.length}`);
  console.log(`Linhas a reajustar:   ${atualizacoes.length} (em ${new Set(atualizacoes.map((a) => a.vinculo)).size} vínculos)`);
  console.log(`Linhas a criar:       ${novos.length}`);
  if (soNoBanco.length) console.log(`⚠ ${soNoBanco.length} vínculos existem no banco e não no CSV (mantidos): ${soNoBanco.join(", ")}`);

  if (atualizacoes.length) {
    console.log("\n-- Rateio dos vínculos divergentes --");
    for (const vinculo of new Set(atualizacoes.map((a) => a.vinculo))) {
      const linhasVinculo = atualizacoes.filter((a) => a.vinculo === vinculo);
      const de = linhasVinculo.reduce((s, a) => s + a.de, 0);
      const para = linhasVinculo.reduce((s, a) => s + a.para, 0);
      console.log(`\n${vinculo}: R$ ${formatar(de)} -> R$ ${formatar(para)}`);
      linhasVinculo.forEach((a) => console.log(`   ${a.natureza.padEnd(26)} ${formatar(a.de).padStart(18)} -> ${formatar(a.para).padStart(18)}`));
    }
  }
  if (novos.length) {
    console.log("\n-- Linhas novas --");
    novos.filter((n) => Number(n.valor) !== 0).forEach((n) => console.log(`   ${String(n.naturezaReceita).padEnd(8)} ${n.fonteRecurso}  ${formatar(Math.round(Number(n.valor) * 100)).padStart(18)}`));
    const zeradas = novos.filter((n) => Number(n.valor) === 0).length;
    if (zeradas) console.log(`   (+ ${zeradas} vínculos sem valor previsto)`);
  }

  const totalDepois = totalAntes + atualizacoes.reduce((s, a) => s + a.para - a.de, 0) + novos.reduce((s, n) => s + Math.round(Number(n.valor) * 100), 0);
  console.log(`\nTotal: R$ ${formatar(totalAntes)} -> R$ ${formatar(totalDepois)} (${totalDepois >= totalAntes ? "+" : ""}${formatar(totalDepois - totalAntes)})`);
  const esperado = totalCsv + [...porVinculo.entries()].filter(([v]) => !vinculosCsvPmo.has(v)).reduce((s, [, l]) => s + l.reduce((t, r) => t + Math.round(Number(r.valor) * 100), 0), 0);
  if (totalDepois !== esperado) throw new Error(`O total final (${formatar(totalDepois)}) não bate com o do CSV (${formatar(esperado)}). Nada foi gravado.`);
  console.log("✓ Total final confere com o CSV.");

  if (!APLICAR) {
    console.log("\n[simulação] Nada foi gravado. Para gravar: --aplicar");
    return;
  }
  fs.mkdirSync("backups", { recursive: true });
  const arquivoBackup = path.join("backups", `antes-ajuste-receita-loa-${EXERCICIO}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(arquivoBackup, JSON.stringify(existentes, (_k, v) => (typeof v === "bigint" ? String(v) : v), 1));
  console.log(`\nBackup da receita atual: ${arquivoBackup}`);
  await db.$transaction([
    ...atualizacoes.map((a) => db.loaReceita.update({ where: { id: a.id }, data: { valor: a.para / 100 } })),
    ...(novos.length ? [db.loaReceita.createMany({ data: novos })] : []),
  ]);
  const gravado = await db.loaReceita.aggregate({ where: { exercicio: EXERCICIO }, _count: { _all: true }, _sum: { valor: true } });
  console.log(`✓ Gravado: ${gravado._count._all} linhas · total R$ ${formatar(Math.round(Number(gravado._sum.valor) * 100))}`);
}

main()
  .catch((erro) => {
    console.error("✗", erro instanceof Error ? erro.message : erro);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
