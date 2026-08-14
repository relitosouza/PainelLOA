import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const LDO_RECORDS = [
  {
    code: "21.003.09.272.0020.2.043",
    secretaria: "21 - IPMO",
    programaCodigo: "0020",
    programaNome: "0020 - GESTÃO E MANUTENÇÃO PREVIDENCIÁRIA",
    funcaoCodigo: "09",
    funcaoNome: "Previdência Social",
    subfuncaoCodigo: "272",
    subfuncaoNome: "Previdência do Regime Estatutário",
    acaoCodigo: "2.043",
    acaoNome: "2.043 - Pagamento de Benefícios Previdenciários",
    produto: "Benefícios previdenciários pagos aos segurados e dependentes",
    custoFinanceiro: 279500000.00,
  },
  {
    code: "21.006.04.241.0018.2.044",
    secretaria: "21 - IPMO",
    programaCodigo: "0018",
    programaNome: "0018 - ATENÇÃO E BENEFÍCIOS PREVIDENCIÁRIOS",
    funcaoCodigo: "04",
    funcaoNome: "Administração",
    subfuncaoCodigo: "241",
    subfuncaoNome: "Assistência ao Idoso",
    acaoCodigo: "2.044",
    acaoNome: "2.044 - Manutenção dos Serviços Previdenciários",
    produto: "Serviços previdenciários mantidos",
    custoFinanceiro: 45000000.00,
  },
  {
    code: "21.001.09.272.0004.1.001",
    secretaria: "21 - IPMO",
    programaCodigo: "0004",
    programaNome: "0004 - REEQUILÍBRIO ATUARIAL E GESTÃO",
    funcaoCodigo: "09",
    funcaoNome: "Previdência Social",
    subfuncaoCodigo: "272",
    subfuncaoNome: "Previdência do Regime Estatutário",
    acaoCodigo: "1.001",
    acaoNome: "1.001 - Modernização e Infraestrutura Previdenciária",
    produto: "Infraestrutura e sistemas atuarias modernizados",
    custoFinanceiro: 4501000.00,
  },
  {
    code: "28.001.04.126.0002.2.007",
    secretaria: "18 - ENCARGOS/ADMINISTRAÇÃO",
    programaCodigo: "0002",
    programaNome: "0002 - GESTÃO TECNOLÓGICA E DE SISTEMAS",
    funcaoCodigo: "04",
    funcaoNome: "Administração",
    subfuncaoCodigo: "126",
    subfuncaoNome: "Tecnologia da Informação",
    acaoCodigo: "2.007",
    acaoNome: "2.007 - Manutenção dos Serviços de Tecnologia da Informação",
    produto: "Sistemas e infraestrutura de TI mantidos",
    custoFinanceiro: 1679600.00,
  },
  {
    code: "19.001.15.451.0013.2.036",
    secretaria: "19 - SECRETARIA DE TRANSPORTE E DA MOBILIDADE URBANA",
    programaCodigo: "0013",
    programaNome: "0013 - MOBILIDADE E SINALIZAÇÃO URBANA",
    funcaoCodigo: "15",
    funcaoNome: "Urbanismo",
    subfuncaoCodigo: "451",
    subfuncaoNome: "Infraestrutura Urbana",
    acaoCodigo: "2.036",
    acaoNome: "2.036 - Manutenção da Sinalização e Trânsito",
    produto: "Malha viária e sinalização mantidas",
    custoFinanceiro: 1440000.00,
  },
  {
    code: "21.001.09.272.0021.0.003",
    secretaria: "21 - IPMO",
    programaCodigo: "0021",
    programaNome: "0021 - RESERVA PREVIDENCIÁRIA E OPERAÇÕES ESPECIALIZADAS",
    funcaoCodigo: "09",
    funcaoNome: "Previdência Social",
    subfuncaoCodigo: "272",
    subfuncaoNome: "Previdência do Regime Estatutário",
    acaoCodigo: "0.003",
    acaoNome: "0.003 - Amortização de Passivo Atuarial",
    produto: "Aporte previdenciário e amortização do passivo atuarial",
    custoFinanceiro: 400000.00,
  },
];

async function main() {
  console.log("=== 1. REMOVENDO REGISTROS DA LOA (BudgetRecord) ===");
  const activeLoaImport = await prisma.loaImport.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (activeLoaImport) {
    const deletedLoaRecords = await prisma.budgetRecord.deleteMany({
      where: {
        importId: activeLoaImport.id,
        value: { in: [279500000, 45000000, 4501000, 1679600, 1440000, 400000] },
      },
    });

    const sumRemoved = 279500000 + 45000000 + 4501000 + 1679600 + 1440000 + 400000;

    const updatedLoaImport = await prisma.loaImport.update({
      where: { id: activeLoaImport.id },
      data: {
        recordCount: { decrement: deletedLoaRecords.count },
        totalValue: { decrement: sumRemoved },
      },
    });

    console.log(`✓ Removidos ${deletedLoaRecords.count} registros da LOA.`);
    console.log(`- Novo Total LOA: R$ ${Number(updatedLoaImport.totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${updatedLoaImport.recordCount} registros)`);
  }

  console.log("\n=== 2. INSERINDO REGISTROS NA LDO (LdoAcao) ===");
  const activeLdoImport = await prisma.ldoAcaoImportacao.findFirst({
    where: { ativo: true },
    orderBy: { criadoEm: "desc" },
  });

  if (!activeLdoImport) {
    console.error("Nenhuma importação ativa da LDO encontrada.");
    process.exit(1);
  }

  let ldoAddedCount = 0;
  let ldoAddedValue = 0;

  for (const item of LDO_RECORDS) {
    const { code, ...ldoData } = item;

    await prisma.ldoAcao.create({
      data: {
        importacaoId: activeLdoImport.id,
        exercicio: activeLdoImport.exercicio,
        secretaria: ldoData.secretaria,
        programaCodigo: ldoData.programaCodigo,
        programaNome: ldoData.programaNome,
        funcaoCodigo: ldoData.funcaoCodigo,
        funcaoNome: ldoData.funcaoNome,
        subfuncaoCodigo: ldoData.subfuncaoCodigo,
        subfuncaoNome: ldoData.subfuncaoNome,
        acaoCodigo: ldoData.acaoCodigo,
        acaoNome: ldoData.acaoNome,
        produto: ldoData.produto,
        custoFinanceiro: ldoData.custoFinanceiro,
      },
    });

    ldoAddedCount++;
    ldoAddedValue += ldoData.custoFinanceiro;
    console.log(`✓ Inserida ação LDO: ${code} - R$ ${ldoData.custoFinanceiro.toLocaleString("pt-BR")}`);
  }

  const updatedLdoImport = await prisma.ldoAcaoImportacao.update({
    where: { id: activeLdoImport.id },
    data: {
      quantidade: { increment: ldoAddedCount },
      valorTotal: { increment: ldoAddedValue },
    },
  });

  console.log(`\nImportação LDO atualizada com sucesso!`);
  console.log(`- ID LDO: ${updatedLdoImport.id}`);
  console.log(`- Ações LDO no total: ${updatedLdoImport.quantidade}`);
  console.log(`- Novo Custo Financeiro Total LDO: R$ ${Number(updatedLdoImport.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
