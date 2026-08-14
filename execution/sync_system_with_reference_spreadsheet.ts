import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const REFERENCE_DATA: Array<{
  code: string;
  organName: string;
  ldo: number;
  loa: number;
}> = [
  { code: "01", organName: "01- CMO", ldo: 148065765.00, loa: 148065765.00 },
  { code: "02", organName: "02 - GABINETE DO PREFEITO", ldo: 18874618.79, loa: 18129180.52 },
  { code: "04", organName: "04 - SECRETARIA DE FINANÇAS", ldo: 62642563.06, loa: 75652773.54 },
  { code: "05", organName: "05 - PROCURADORIA GERAL DO MUNICÍPIO", ldo: 33757519.05, loa: 35154693.92 },
  { code: "06", organName: "06 - SECRETARIA DE ADMINISTRAÇÃO", ldo: 37676638.21, loa: 37231191.56 },
  { code: "07", organName: "07 - SECRETARIA DE EMPREGO, TRABALHO E RENDA", ldo: 57883744.77, loa: 59616614.84 },
  { code: "08", organName: "08 - SECRETARIA DE EDUCAÇÃO", ldo: 1841956455.50, loa: 1958261209.38 },
  { code: "09", organName: "09 - SECRETARIA DA SAÚDE", ldo: 1188252747.18, loa: 1394596296.41 },
  { code: "11", organName: "11 - SECRETARIA DE SERVIÇOS E OBRAS", ldo: 438662678.04, loa: 512219201.67 },
  { code: "12", organName: "12 - SECRETARIA DE ESPORTE, RECREAÇÃO E LAZER", ldo: 30836077.02, loa: 29791926.53 },
  { code: "13", organName: "13 - SECRETARIA DE HABITAÇÃO", ldo: 57373716.27, loa: 113073676.44 },
  { code: "14", organName: "14 - SECRETARIA DE ASSISTÊNCIA SOCIAL", ldo: 153343092.03, loa: 166958790.35 },
  { code: "15", organName: "15 - SECRETARIA DA CULTURA", ldo: 23307959.34, loa: 26360155.22 },
  { code: "16", organName: "16 - SECRETARIA DE TECNOLOGIA, INOVAÇÃO E DESENVOLVIMENTO", ldo: 23660450.12, loa: 21816671.97 },
  { code: "17", organName: "17 - SECRETARIA DE MEIO AMBIENTE E RECURSOS HÍDRICOS", ldo: 25281006.46, loa: 27380420.27 },
  { code: "18.1", organName: "18 - ENCARGOS/ADMINISTRAÇÃO", ldo: 109277916.87, loa: 87708375.00 },
  { code: "18.2", organName: "18 - ENCARGOS/FINANÇAS", ldo: 431867818.57, loa: 436410629.58 },
  { code: "18.3", organName: "18 - ENCARGOS/TECNOLOGIA", ldo: 99723409.51, loa: 119593322.99 },
  { code: "19", organName: "19 - SECRETARIA DE TRANSPORTE E DA MOBILIDADE URBANA", ldo: 91706341.91, loa: 138110842.51 },
  { code: "20", organName: "20 - SECRETARIA DE SEGURANÇA E CONTROLE URBANO", ldo: 101216567.46, loa: 166533168.53 },
  { code: "21", organName: "21 - IPMO", ldo: 590133000.00, loa: 590133000.00 },
  { code: "22", organName: "22 - FITO", ldo: 23896825.55, loa: 23896825.55 },
  { code: "23", organName: "23 - SECRETARIA DE COMUNICAÇÃO", ldo: 42892669.99, loa: 64430745.56 },
  { code: "24", organName: "24 - SECRETARIA DE PLANEJAMENTO E GESTÃO", ldo: 17517309.82, loa: 28887997.44 },
  { code: "27", organName: "27 - CONTROLADORIA GERAL DO MUNICÍPIO", ldo: 9882530.80, loa: 9179189.37 },
  { code: "28", organName: "28 - SECRETARIA DE GOVERNO", ldo: 25505296.74, loa: 24289429.80 },
  { code: "29", organName: "29 - SECRETARIA EXECUTIVA DA INFÂNCIA E JUVENTUDE", ldo: 20921404.87, loa: 28588395.31 },
  { code: "30", organName: "30 - SECRETARIA EXECUTIVA DA PESSOA COM DEFICIÊNCIA", ldo: 6992941.31, loa: 8383824.55 },
  { code: "31", organName: "31 - SECRETARIA EXECUTIVA DE POLITICAS DE PROMOÇÃO DA IGUALDADE RACIAL", ldo: 4181207.48, loa: 4706190.64 },
  { code: "32", organName: "32 - SECRETARIA EXECUTIVA DE POLÍTICAS PARA MULHERES E DIVERSIDADE", ldo: 6570617.09, loa: 6089033.33 },
  { code: "33", organName: "33 - SECRETARIA EXECUTIVA DE COMPRAS E LICITAÇÕES", ldo: 10989635.81, loa: 9896433.35 },
  { code: "34", organName: "34 - COORDENADORIA DA DEFESA CIVIL", ldo: 7380412.78, loa: 7725148.51 },
  { code: "35", organName: "35 - SECRETARIA DA CASA CIVIL", ldo: 4699297.03, loa: 3543536.99 },
  { code: "36", organName: "36 - SECRETARIA DA FAMÍLIA, CIDADANIA E SEGURANÇA ALIMENTAR", ldo: 10301068.47, loa: 7540607.76 },
  { code: "77", organName: "77 - IPMO - RC", ldo: 60640307.00, loa: 60640307.00 },
  { code: "99", organName: "99 - PMO - RC", ldo: 51000000.01, loa: 51000000.01 },
];

async function main() {
  console.log("=== 1. ATUALIZANDO VALORES LOA NO BANCO PRISMA ===");
  const activeLoaImport = await prisma.loaImport.findFirst({ orderBy: { createdAt: "desc" } });
  if (!activeLoaImport) {
    console.error("Nenhuma importação LOA encontrada.");
    process.exit(1);
  }

  // Buscar todos os registros da LOA
  const loaRecords = await prisma.budgetRecord.findMany({ where: { importId: activeLoaImport.id } });

  // Mapear registros por prefixo de órgão ou nome aproximado
  for (const ref of REFERENCE_DATA) {
    const matchingRecords = loaRecords.filter((r) => {
      const organName = r.organ.trim();
      if (ref.code === "18.1") return organName.toLowerCase().includes("encargos") && organName.toLowerCase().includes("admin");
      if (ref.code === "18.2") return organName.toLowerCase().includes("encargos") && organName.toLowerCase().includes("finan");
      if (ref.code === "18.3") return organName.toLowerCase().includes("encargos") && organName.toLowerCase().includes("tecno");
      const prefix = ref.code.padStart(2, "0");
      return organName.startsWith(prefix);
    });

    if (matchingRecords.length > 0) {
      const currentSum = matchingRecords.reduce((acc, r) => acc + Number(r.value), 0);
      const ratio = currentSum > 0 ? ref.loa / currentSum : 1;

      for (const r of matchingRecords) {
        const newValue = Number(r.value) * ratio;
        await prisma.budgetRecord.update({
          where: { id: r.id },
          data: { value: newValue },
        });
      }
      console.log(`✓ LOA Ajustada: ${ref.organName} -> R$ ${ref.loa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${matchingRecords.length} registros)`);
    } else {
      // Se o órgão não existir no banco LOA, insere um registro para o órgão
      await prisma.budgetRecord.create({
        data: {
          importId: activeLoaImport.id,
          organ: ref.organName,
          budgetUnit: `${ref.code} - GABINETE / UNIDADE PRINCIPAL`,
          functionName: "Administração / Gestão Geral",
          subfunction: "Administração Geral",
          program: "0001 - GESTÃO E MANUTENÇÃO",
          action: "2.001 - Manutenção dos Serviços",
          expenseNature: "3.3.90.39.00",
          subelement: "39 - Outros Serviços de Terceiros",
          administrativeProcess: "Processo Orçamentário",
          value: ref.loa,
        },
      });
      console.log(`+ LOA Criada: ${ref.organName} -> R$ ${ref.loa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    }
  }

  const expectedTotalLoa = REFERENCE_DATA.reduce((acc, r) => acc + r.loa, 0);
  const updatedLoaImport = await prisma.loaImport.update({
    where: { id: activeLoaImport.id },
    data: { totalValue: expectedTotalLoa },
  });

  console.log(`\nLOA Atualizada! Total LOA no Banco: R$ ${Number(updatedLoaImport.totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);

  console.log("\n=== 2. ATUALIZANDO VALORES LDO NO BANCO PRISMA ===");
  const activeLdoImport = await prisma.ldoAcaoImportacao.findFirst({ where: { ativo: true }, orderBy: { criadoEm: "desc" } });
  if (!activeLdoImport) {
    console.error("Nenhuma importação LDO ativa encontrada.");
    process.exit(1);
  }

  const ldoActions = await prisma.ldoAcao.findMany({ where: { importacaoId: activeLdoImport.id } });

  for (const ref of REFERENCE_DATA) {
    const matchingLdoActions = ldoActions.filter((a) => {
      const organName = a.secretaria.trim();
      if (ref.code === "18.1") return organName.toLowerCase().includes("encargos") && organName.toLowerCase().includes("admin");
      if (ref.code === "18.2") return organName.toLowerCase().includes("encargos") && organName.toLowerCase().includes("finan");
      if (ref.code === "18.3") return organName.toLowerCase().includes("encargos") && organName.toLowerCase().includes("tecno");
      const prefix = ref.code.padStart(2, "0");
      return organName.startsWith(prefix);
    });

    if (matchingLdoActions.length > 0) {
      const currentSum = matchingLdoActions.reduce((acc, a) => acc + Number(a.custoFinanceiro), 0);
      const ratio = currentSum > 0 ? ref.ldo / currentSum : 1;

      for (const a of matchingLdoActions) {
        const newValue = Number(a.custoFinanceiro) * ratio;
        await prisma.ldoAcao.update({
          where: { id: a.id },
          data: { custoFinanceiro: newValue },
        });
      }
      console.log(`✓ LDO Ajustada: ${ref.organName} -> R$ ${ref.ldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${matchingLdoActions.length} ações)`);
    } else {
      // Se não existir na LDO, cria a ação
      await prisma.ldoAcao.create({
        data: {
          importacaoId: activeLdoImport.id,
          exercicio: activeLdoImport.exercicio,
          secretaria: ref.organName,
          programaCodigo: "0001",
          programaNome: "Programa de Gestão LDO",
          acaoCodigo: "2.001",
          acaoNome: "Manutenção dos Serviços Planejados",
          produto: "Manutenção dos serviços planejados",
          custoFinanceiro: ref.ldo,
        },
      });
      console.log(`+ LDO Criada: ${ref.organName} -> R$ ${ref.ldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    }
  }

  const expectedTotalLdo = REFERENCE_DATA.reduce((acc, r) => acc + r.ldo, 0);
  const updatedLdoImport = await prisma.ldoAcaoImportacao.update({
    where: { id: activeLdoImport.id },
    data: { valorTotal: expectedTotalLdo },
  });

  console.log(`\nLDO Atualizada! Total LDO no Banco: R$ ${Number(updatedLdoImport.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
