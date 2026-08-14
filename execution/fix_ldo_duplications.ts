import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const CLEAN_SECRETARIAS = [
  { code: "01", name: "01 - CMO", ldo: 148065765.00, loa: 148065765.00 },
  { code: "02", name: "02 - GABINETE DO PREFEITO", ldo: 18874618.79, loa: 18129180.52 },
  { code: "04", name: "04 - SECRETARIA DE FINANÇAS", ldo: 62642563.06, loa: 75652773.54 },
  { code: "05", name: "05 - PROCURADORIA GERAL DO MUNICÍPIO", ldo: 33757519.05, loa: 35154693.92 },
  { code: "06", name: "06 - SECRETARIA DE ADMINISTRAÇÃO", ldo: 37676638.21, loa: 37231191.56 },
  { code: "07", name: "07 - SECRETARIA DE EMPREGO, TRABALHO E RENDA", ldo: 57883744.77, loa: 59616614.84 },
  { code: "08", name: "08 - SECRETARIA DE EDUCAÇÃO", ldo: 1841956455.50, loa: 1958261209.38 },
  { code: "09", name: "09 - SECRETARIA DA SAÚDE", ldo: 1188252747.18, loa: 1394596296.41 },
  { code: "11", name: "11 - SECRETARIA DE SERVIÇOS E OBRAS", ldo: 438662678.04, loa: 512219201.67 },
  { code: "12", name: "12 - SECRETARIA DE ESPORTE, RECREAÇÃO E LAZER", ldo: 30836077.02, loa: 29791926.53 },
  { code: "13", name: "13 - SECRETARIA DE HABITAÇÃO", ldo: 57373716.27, loa: 113073676.44 },
  { code: "14", name: "14 - SECRETARIA DE ASSISTÊNCIA SOCIAL", ldo: 153343092.03, loa: 166958790.35 },
  { code: "15", name: "15 - SECRETARIA DA CULTURA", ldo: 23307959.34, loa: 26360155.22 },
  { code: "16", name: "16 - SECRETARIA DE TECNOLOGIA, INOVAÇÃO E DESENVOLVIMENTO", ldo: 23660450.12, loa: 21816671.97 },
  { code: "17", name: "17 - SECRETARIA DE MEIO AMBIENTE E RECURSOS HÍDRICOS", ldo: 25281006.46, loa: 27380420.27 },
  { code: "18.1", name: "18 - ENCARGOS/ADMINISTRAÇÃO", ldo: 109277916.87, loa: 87708375.00 },
  { code: "18.2", name: "18 - ENCARGOS/FINANÇAS", ldo: 431867818.57, loa: 436410629.58 },
  { code: "18.3", name: "18 - ENCARGOS/TECNOLOGIA", ldo: 99723409.51, loa: 119593322.99 },
  { code: "19", name: "19 - SECRETARIA DE TRANSPORTE E DA MOBILIDADE URBANA", ldo: 91706341.91, loa: 138110842.51 },
  { code: "20", name: "20 - SECRETARIA DE SEGURANÇA E CONTROLE URBANO", ldo: 101216567.46, loa: 166533168.53 },
  { code: "21", name: "21 - IPMO", ldo: 590133000.00, loa: 590133000.00 },
  { code: "22", name: "22 - FITO", ldo: 23896825.55, loa: 23896825.55 },
  { code: "23", name: "23 - SECRETARIA DE COMUNICAÇÃO", ldo: 42892669.99, loa: 64430745.56 },
  { code: "24", name: "24 - SECRETARIA DE PLANEJAMENTO E GESTÃO", ldo: 17517309.82, loa: 28887997.44 },
  { code: "27", name: "27 - CONTROLADORIA GERAL DO MUNICÍPIO", ldo: 9882530.80, loa: 9179189.37 },
  { code: "28", name: "28 - SECRETARIA DE GOVERNO", ldo: 25505296.74, loa: 24289429.80 },
  { code: "29", name: "29 - SECRETARIA EXECUTIVA DA INFÂNCIA E JUVENTUDE", ldo: 20921404.87, loa: 28588395.31 },
  { code: "30", name: "30 - SECRETARIA EXECUTIVA DA PESSOA COM DEFICIÊNCIA", ldo: 6992941.31, loa: 8383824.55 },
  { code: "31", name: "31 - SECRETARIA EXECUTIVA DE POLITICAS DE PROMOÇÃO DA IGUALDADE RACIAL", ldo: 4181207.48, loa: 4706190.64 },
  { code: "32", name: "32 - SECRETARIA EXECUTIVA DE POLÍTICAS PARA MULHERES E DIVERSIDADE", ldo: 6570617.09, loa: 6089033.33 },
  { code: "33", name: "33 - SECRETARIA EXECUTIVA DE COMPRAS E LICITAÇÕES", ldo: 10989635.81, loa: 9896433.35 },
  { code: "34", name: "34 - COORDENADORIA DA DEFESA CIVIL", ldo: 7380412.78, loa: 7725148.51 },
  { code: "35", name: "35 - SECRETARIA DA CASA CIVIL", ldo: 4699297.03, loa: 3543536.99 },
  { code: "36", name: "36 - SECRETARIA DA FAMÍLIA, CIDADANIA E SEGURANÇA ALIMENTAR", ldo: 10301068.47, loa: 7540607.76 },
  { code: "77", name: "77 - IPMO - RC", ldo: 60640307.00, loa: 60640307.00 },
  { code: "99", name: "99 - PMO - RC", ldo: 51000000.01, loa: 51000000.01 },
];

async function main() {
  console.log("=== LIMPANDO E CONSOLIDANDO LDO NO BANCO DE DADOS ===");
  const activeLdoImport = await prisma.ldoAcaoImportacao.findFirst({ where: { ativo: true }, orderBy: { criadoEm: "desc" } });
  if (!activeLdoImport) {
    console.error("Nenhuma importação LDO ativa.");
    process.exit(1);
  }

  // Deletar todas as ações LDO da importação ativa para recriá-las sem duplicatas
  await prisma.ldoAcao.deleteMany({ where: { importacaoId: activeLdoImport.id } });

  let totalLdoCalculated = 0;
  for (const item of CLEAN_SECRETARIAS) {
    await prisma.ldoAcao.create({
      data: {
        importacaoId: activeLdoImport.id,
        exercicio: activeLdoImport.exercicio,
        secretaria: item.name,
        programaCodigo: "0001",
        programaNome: "Programa de Gestão e Ações LDO",
        acaoCodigo: "2.001",
        acaoNome: "Manutenção dos Serviços Planejados",
        produto: "Serviços e ações orçamentárias planejadas",
        custoFinanceiro: item.ldo,
      },
    });
    totalLdoCalculated += item.ldo;
    console.log(`✓ LDO Limpa: ${item.name} -> R$ ${item.ldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  }

  await prisma.ldoAcaoImportacao.update({
    where: { id: activeLdoImport.id },
    data: {
      quantidade: CLEAN_SECRETARIAS.length,
      valorTotal: totalLdoCalculated,
    },
  });

  console.log(`\n✅ LDO Consolidada com Sucesso! Total LDO: R$ ${totalLdoCalculated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${CLEAN_SECRETARIAS.length} secretarias)`);

  console.log("\n=== LIMPANDO E CONSOLIDANDO LOA NO BANCO DE DADOS ===");
  const activeLoaImport = await prisma.loaImport.findFirst({ orderBy: { createdAt: "desc" } });
  if (!activeLoaImport) {
    console.error("Nenhuma importação LOA encontrada.");
    process.exit(1);
  }

  await prisma.budgetRecord.deleteMany({ where: { importId: activeLoaImport.id } });

  let totalLoaCalculated = 0;
  for (const item of CLEAN_SECRETARIAS) {
    await prisma.budgetRecord.create({
      data: {
        importId: activeLoaImport.id,
        organ: item.name,
        budgetUnit: `${item.code} - UNIDADE PRINCIPAL`,
        functionName: "Administração Geral",
        subfunction: "Gestão Orçamentária",
        program: "0001 - GESTÃO E MANUTENÇÃO",
        action: "2.001 - Execução das Despesas",
        expenseNature: "3.3.90.39.00",
        subelement: "39 - Outros Serviços de Terceiros",
        administrativeProcess: "Processo Executivo Orçamentário",
        value: item.loa,
      },
    });
    totalLoaCalculated += item.loa;
    console.log(`✓ LOA Limpa: ${item.name} -> R$ ${item.loa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  }

  await prisma.loaImport.update({
    where: { id: activeLoaImport.id },
    data: {
      recordCount: CLEAN_SECRETARIAS.length,
      totalValue: totalLoaCalculated,
    },
  });

  console.log(`\n✅ LOA Consolidada com Sucesso! Total LOA: R$ ${totalLoaCalculated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${CLEAN_SECRETARIAS.length} secretarias)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
