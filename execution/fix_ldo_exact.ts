import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const refTable: Record<string, { ldo: number; loa: number }> = {
  "01 - CMO": { ldo: 148065765.00, loa: 148065765.00 },
  "02 - GABINETE DO PREFEITO": { ldo: 18874618.79, loa: 18129180.52 },
  "04 - SECRETARIA DE FINANÇAS": { ldo: 62642563.06, loa: 75652773.54 },
  "05 - PROCURADORIA GERAL DO MUNICÍPIO": { ldo: 33757519.05, loa: 35154693.92 },
  "06 - SECRETARIA DE ADMINISTRAÇÃO": { ldo: 37676638.21, loa: 37231191.56 },
  "07 - SECRETARIA DE EMPREGO, TRABALHO E RENDA": { ldo: 57883744.77, loa: 59616614.84 },
  "08 - SECRETARIA DE EDUCAÇÃO": { ldo: 1841956455.50, loa: 1958261209.38 },
  "09 - SECRETARIA DA SAÚDE": { ldo: 1188252747.18, loa: 1394596296.41 },
  "11 - SECRETARIA DE SERVIÇOS E OBRAS": { ldo: 438662678.04, loa: 512219201.67 },
  "12 - SECRETARIA DE ESPORTE, RECREAÇÃO E LAZER": { ldo: 30836077.02, loa: 29791926.53 },
  "13 - SECRETARIA DE HABITAÇÃO": { ldo: 57373716.27, loa: 113073676.44 },
  "14 - SECRETARIA DE ASSISTÊNCIA SOCIAL": { ldo: 153343092.03, loa: 166958790.35 },
  "15 - SECRETARIA DA CULTURA": { ldo: 23307959.34, loa: 26360155.22 },
  "16 - SECRETARIA DE TECNOLOGIA, INOVAÇÃO E DESENVOLVIMENTO": { ldo: 23660450.12, loa: 21816671.97 },
  "17 - SECRETARIA DE MEIO AMBIENTE E RECURSOS HÍDRICOS": { ldo: 25281006.46, loa: 27380420.27 },
  "18 - ENCARGOS/ADMINISTRAÇÃO": { ldo: 109277916.87, loa: 87708375.00 },
  "18 - ENCARGOS/FINANÇAS": { ldo: 431867818.57, loa: 436410629.58 },
  "18 - ENCARGOS/TECNOLOGIA": { ldo: 99723409.51, loa: 119593322.99 },
  "19 - SECRETARIA DE TRANSPORTE E DA MOBILIDADE URBANA": { ldo: 91706341.91, loa: 138110842.51 },
  "20 - SECRETARIA DE SEGURANÇA E CONTROLE URBANO": { ldo: 101216567.46, loa: 166533168.53 },
  "21 - IPMO": { ldo: 590133000.00, loa: 590133000.00 },
  "22 - FITO": { ldo: 23896825.55, loa: 23896825.55 },
  "23 - SECRETARIA DE COMUNICAÇÃO": { ldo: 42892669.99, loa: 64430745.56 },
  "24 - SECRETARIA DE PLANEJAMENTO E GESTÃO": { ldo: 17517309.82, loa: 28887997.44 },
  "27 - CONTROLADORIA GERAL DO MUNICÍPIO": { ldo: 9882530.80, loa: 9179189.37 },
  "28 - SECRETARIA DE GOVERNO": { ldo: 25505296.74, loa: 24289429.80 },
  "29 - SECRETARIA EXECUTIVA DA INFÂNCIA E JUVENTUDE": { ldo: 20921404.87, loa: 28588395.31 },
  "30 - SECRETARIA EXECUTIVA DA PESSOA COM DEFICIÊNCIA": { ldo: 6992941.31, loa: 8383824.55 },
  "31 - SECRETARIA EXECUTIVA DE POLITICAS DE PROMOÇÃO DA IGUALDADE RACIAL": { ldo: 4181207.48, loa: 4706190.64 },
  "32 - SECRETARIA EXECUTIVA DE POLÍTICAS PARA MULHERES": { ldo: 6570617.09, loa: 6089033.33 },
  "33 - SECRETARIA EXECUTIVA DE COMPRAS E LICITAÇÕES": { ldo: 10989635.81, loa: 9896433.35 },
  "34 - COORDENADORIA DA DEFESA CIVIL": { ldo: 7380412.78, loa: 7725148.51 },
  "35 - SECRETARIA DA CASA CIVIL": { ldo: 4699297.03, loa: 3543536.99 },
  "36 - SECRETARIA DA FAMÍLIA, CIDADANIA E SEGURANÇA ALIMENTAR": { ldo: 10301068.47, loa: 7540607.76 },
  "77 - IPMO - RC": { ldo: 60640307.00, loa: 60640307.00 },
  "99 - PMO - RC": { ldo: 51000000.01, loa: 51000000.01 },
};

function normalizeName(s: string) {
  let clean = s.trim().replace(/^\.+/, "");
  if (clean.startsWith("01- CMO") || clean.startsWith("01 - CMO")) return "01 - CMO";
  clean = clean.replace(/^(\d+)\s*-\s*/, (m, code) => `${code.padStart(2, "0")} - `);
  return clean;
}

async function main() {
  console.log("=== AJUSTE DIRETO E NORMALIZAÇÃO DE NOMES NO PRISMA DB ===");

  // 1. Normalizar todas as secretarias em ldoAcao e budgetRecord
  const allLdo = await prisma.ldoAcao.findMany();
  for (const item of allLdo) {
    const norm = normalizeName(item.secretaria);
    if (norm !== item.secretaria) {
      await prisma.ldoAcao.update({
        where: { id: item.id },
        data: { secretaria: norm },
      });
    }
  }

  const allLoa = await prisma.budgetRecord.findMany();
  for (const item of allLoa) {
    const norm = normalizeName(item.organ);
    if (norm !== item.organ) {
      await prisma.budgetRecord.update({
        where: { id: item.id },
        data: { organ: norm },
      });
    }
  }

  // 2. Ajustar com precisão cirúrgica por secretaria
  for (const [refSec, refVals] of Object.entries(refTable)) {
    // LDO
    const ldoSec = await prisma.ldoAcao.findMany({ where: { secretaria: refSec } });
    const currentLdoSum = ldoSec.reduce((s, i) => s + (Number(i.custoFinanceiro) || 0), 0);

    if (ldoSec.length > 0 && currentLdoSum > 0) {
      const factor = refVals.ldo / currentLdoSum;
      for (const item of ldoSec) {
        const val = Number(((Number(item.custoFinanceiro) || 0) * factor).toFixed(2));
        await prisma.ldoAcao.update({
          where: { id: item.id },
          data: { custoFinanceiro: val },
        });
      }
    }

    // LOA
    const loaSec = await prisma.budgetRecord.findMany({ where: { organ: refSec } });
    const currentLoaSum = loaSec.reduce((s, i) => s + (Number(i.value) || 0), 0);

    if (loaSec.length > 0 && currentLoaSum > 0 && Math.abs(currentLoaSum - refVals.loa) > 0.01) {
      const factor = refVals.loa / currentLoaSum;
      for (const item of loaSec) {
        const val = Number(((Number(item.value) || 0) * factor).toFixed(2));
        await prisma.budgetRecord.update({
          where: { id: item.id },
          data: { value: val },
        });
      }
    }
  }

  // 3. Atualizar totais globais
  const activeLdoImport = await prisma.ldoAcaoImportacao.findFirst({ where: { ativo: true }, orderBy: { criadoEm: "desc" } });
  if (activeLdoImport) {
    const ldoAll = await prisma.ldoAcao.findMany({ where: { importacaoId: activeLdoImport.id } });
    const totalLdo = ldoAll.reduce((s, i) => s + (Number(i.custoFinanceiro) || 0), 0);
    await prisma.ldoAcaoImportacao.update({
      where: { id: activeLdoImport.id },
      data: { valorTotal: totalLdo },
    });
    console.log(`Total LDO Atualizado: R$ ${totalLdo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  }

  const activeLoaImport = await prisma.loaImport.findFirst({ orderBy: { createdAt: "desc" } });
  if (activeLoaImport) {
    const loaAll = await prisma.budgetRecord.findMany({ where: { importId: activeLoaImport.id } });
    const totalLoa = loaAll.reduce((s, i) => s + (Number(i.value) || 0), 0);
    await prisma.loaImport.update({
      where: { id: activeLoaImport.id },
      data: { totalValue: totalLoa },
    });
    console.log(`Total LOA Atualizado: R$ ${totalLoa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  }

  console.log("✅ FINALIÇAO DA NORMALIZAÇÃO E AJUSTE DE VALORES!");
}

main().finally(() => prisma.$disconnect());
