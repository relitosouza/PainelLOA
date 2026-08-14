import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const refTable: Record<string, { ldo: number; loa: number; diff: number }> = {
  "01 - CMO": { ldo: 148065765.00, loa: 148065765.00, diff: 0.00 },
  "02 - GABINETE DO PREFEITO": { ldo: 18874618.79, loa: 18129180.52, diff: 745438.27 },
  "04 - SECRETARIA DE FINANÇAS": { ldo: 62642563.06, loa: 75652773.54, diff: -13010210.48 },
  "05 - PROCURADORIA GERAL DO MUNICÍPIO": { ldo: 33757519.05, loa: 35154693.92, diff: -1397174.87 },
  "06 - SECRETARIA DE ADMINISTRAÇÃO": { ldo: 37676638.21, loa: 37231191.56, diff: 445446.65 },
  "07 - SECRETARIA DE EMPREGO, TRABALHO E RENDA": { ldo: 57883744.77, loa: 59616614.84, diff: -1732870.07 },
  "08 - SECRETARIA DE EDUCAÇÃO": { ldo: 1841956455.50, loa: 1958261209.38, diff: -116304753.88 },
  "09 - SECRETARIA DA SAÚDE": { ldo: 1188252747.18, loa: 1394596296.41, diff: -206343549.23 },
  "11 - SECRETARIA DE SERVIÇOS E OBRAS": { ldo: 438662678.04, loa: 512219201.67, diff: -73556523.63 },
  "12 - SECRETARIA DE ESPORTE, RECREAÇÃO E LAZER": { ldo: 30836077.02, loa: 29791926.53, diff: 1044150.49 },
  "13 - SECRETARIA DE HABITAÇÃO": { ldo: 57373716.27, loa: 113073676.44, diff: -55699960.17 },
  "14 - SECRETARIA DE ASSISTÊNCIA SOCIAL": { ldo: 153343092.03, loa: 166958790.35, diff: -13615698.33 },
  "15 - SECRETARIA DA CULTURA": { ldo: 23307959.34, loa: 26360155.22, diff: -3052195.88 },
  "16 - SECRETARIA DE TECNOLOGIA, INOVAÇÃO E DESENVOLVIMENTO": { ldo: 23660450.12, loa: 21816671.97, diff: 1843778.15 },
  "17 - SECRETARIA DE MEIO AMBIENTE E RECURSOS HÍDRICOS": { ldo: 25281006.46, loa: 27380420.27, diff: -2099413.81 },
  "18 - ENCARGOS/ADMINISTRAÇÃO": { ldo: 109277916.87, loa: 87708375.00, diff: 21569541.87 },
  "18 - ENCARGOS/FINANÇAS": { ldo: 431867818.57, loa: 436410629.58, diff: -4542811.01 },
  "18 - ENCARGOS/TECNOLOGIA": { ldo: 99723409.51, loa: 119593322.99, diff: -19869913.48 },
  "19 - SECRETARIA DE TRANSPORTE E DA MOBILIDADE URBANA": { ldo: 91706341.91, loa: 138110842.51, diff: -46404500.60 },
  "20 - SECRETARIA DE SEGURANÇA E CONTROLE URBANO": { ldo: 101216567.46, loa: 166533168.53, diff: -65316601.07 },
  "21 - IPMO": { ldo: 590133000.00, loa: 590133000.00, diff: 0.00 },
  "22 - FITO": { ldo: 23896825.55, loa: 23896825.55, diff: 0.00 },
  "23 - SECRETARIA DE COMUNICAÇÃO": { ldo: 42892669.99, loa: 64430745.56, diff: -21538075.57 },
  "24 - SECRETARIA DE PLANEJAMENTO E GESTÃO": { ldo: 17517309.82, loa: 28887997.44, diff: -11370687.62 },
  "27 - CONTROLADORIA GERAL DO MUNICÍPIO": { ldo: 9882530.80, loa: 9179189.37, diff: 703341.43 },
  "28 - SECRETARIA DE GOVERNO": { ldo: 25505296.74, loa: 24289429.80, diff: 1215866.94 },
  "29 - SECRETARIA EXECUTIVA DA INFÂNCIA E JUVENTUDE": { ldo: 20921404.87, loa: 28588395.31, diff: -7666990.44 },
  "30 - SECRETARIA EXECUTIVA DA PESSOA COM DEFICIÊNCIA": { ldo: 6992941.31, loa: 8383824.55, diff: -1390883.24 },
  "31 - SECRETARIA EXECUTIVA DE POLITICAS DE PROMOÇÃO DA IGUALDADE RACIAL": { ldo: 4181207.48, loa: 4706190.64, diff: -524983.16 },
  "32 - SECRETARIA EXECUTIVA DE POLÍTICAS PARA MULHERES": { ldo: 6570617.09, loa: 6089033.33, diff: 481583.76 },
  "33 - SECRETARIA EXECUTIVA DE COMPRAS E LICITAÇÕES": { ldo: 10989635.81, loa: 9896433.35, diff: 1093202.46 },
  "34 - COORDENADORIA DA DEFESA CIVIL": { ldo: 7380412.78, loa: 7725148.51, diff: -344735.73 },
  "35 - SECRETARIA DA CASA CIVIL": { ldo: 4699297.03, loa: 3543536.99, diff: 1155760.04 },
  "36 - SECRETARIA DA FAMÍLIA, CIDADANIA E SEGURANÇA ALIMENTAR": { ldo: 10301068.47, loa: 7540607.76, diff: 2760460.71 },
  "77 - IPMO - RC": { ldo: 60640307.00, loa: 60640307.00, diff: 0.00 },
  "99 - PMO - RC": { ldo: 51000000.01, loa: 51000000.01, diff: 0.00 },
};

function extractCode(s: string) {
  const m = s.trim().match(/^(\d+)/);
  return m ? m[1].padStart(2, "0") : s;
}

function matches(itemSec: string, refSec: string) {
  const normItem = itemSec.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normRef = refSec.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (normItem === normRef) return true;

  const itemCode = extractCode(normItem);
  const refCode = extractCode(normRef);

  if (itemCode !== refCode) return false;

  if (refCode === "18") {
    if (normRef.includes("ADMIN") && normItem.includes("ADMIN")) return true;
    if (normRef.includes("FINAN") && normItem.includes("FINAN")) return true;
    if (normRef.includes("TECNO") && normItem.includes("TECNO")) return true;
    return false;
  }

  return true;
}

async function main() {
  const loaRecords = await prisma.budgetRecord.findMany();
  const ldoRecords = await prisma.ldoAcao.findMany();

  let out = "";
  let mismatches = 0;

  for (const [refSec, refVals] of Object.entries(refTable)) {
    const matchingLoa = loaRecords.filter((r) => matches(r.organ, refSec));
    const matchingLdo = ldoRecords.filter((r) => matches(r.secretaria, refSec));

    const dbLoa = matchingLoa.reduce((s, r) => s + (Number(r.value) || 0), 0);
    const dbLdo = matchingLdo.reduce((s, r) => s + (Number(r.custoFinanceiro) || 0), 0);

    const diffLoa = Math.abs(dbLoa - refVals.loa);
    const diffLdo = Math.abs(dbLdo - refVals.ldo);

    if (diffLoa > 0.05 || diffLdo > 0.05) {
      mismatches++;
      out += `DIVERGENCIA: [${refSec}] LDO_ref=${refVals.ldo.toFixed(2)} LDO_db=${dbLdo.toFixed(2)} | LOA_ref=${refVals.loa.toFixed(2)} LOA_db=${dbLoa.toFixed(2)}\n`;
    } else {
      out += `OK: [${refSec}] LDO=${dbLdo.toFixed(2)} LOA=${dbLoa.toFixed(2)}\n`;
    }
  }

  out += `\nTOTAL DIVERGENCIAS: ${mismatches}\n`;
  fs.writeFileSync(".tmp/check_results.txt", out);
}

main().finally(() => prisma.$disconnect());
