import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const MISSING_RECORDS = [
  {
    code: "21.003.09.272.0020.2.043",
    organ: "21 - IPMO",
    budgetUnit: "21.003 - FUNDO FINANCEIRO PREVIDENCIÁRIO",
    functionName: "Previdência Social",
    subfunction: "Previdência do Regime Estatutário",
    program: "0020 - GESTÃO E MANUTENÇÃO PREVIDENCIÁRIA",
    action: "2.043 - Pagamento de Benefícios Previdenciários",
    expenseNature: "3.1.90.01.00",
    subelement: "01 - Aposentadorias e Reformas",
    administrativeProcess: "Pagamento Folha de Inativos e Pensionistas",
    value: 279500000.00,
  },
  {
    code: "21.006.04.241.0018.2.044",
    organ: "21 - IPMO",
    budgetUnit: "21.006 - FUNDO PREVIDENCIÁRIO",
    functionName: "Administração",
    subfunction: "Assistência ao Idoso",
    program: "0018 - ATENÇÃO E BENEFÍCIOS PREVIDENCIÁRIOS",
    action: "2.044 - Manutenção dos Serviços Previdenciários",
    expenseNature: "3.3.90.39.00",
    subelement: "39 - Outros Serviços de Terceiros - Pessoa Jurídica",
    administrativeProcess: "Gestão do Fundo Previdenciário",
    value: 45000000.00,
  },
  {
    code: "21.001.09.272.0004.1.001",
    organ: "21 - IPMO",
    budgetUnit: "21.001 - GABINETE DO IPMO",
    functionName: "Previdência Social",
    subfunction: "Previdência do Regime Estatutário",
    program: "0004 - REEQUILÍBRIO ATUARIAL E GESTÃO",
    action: "1.001 - Modernização e Infraestrutura Previdenciária",
    expenseNature: "4.4.90.52.00",
    subelement: "52 - Equipamentos e Material Permanente",
    administrativeProcess: "Modernização Tecnológica e Atuarial",
    value: 4501000.00,
  },
  {
    code: "28.001.04.126.0002.2.007",
    organ: "18 - ENCARGOS/ADMINISTRAÇÃO",
    budgetUnit: "28.001 - ENCARGOS GERAIS DO MUNICÍPIO",
    functionName: "Administração",
    subfunction: "Tecnologia da Informação",
    program: "0002 - GESTÃO TECNOLÓGICA E DE SISTEMAS",
    action: "2.007 - Manutenção dos Serviços de Tecnologia da Informação",
    expenseNature: "3.3.90.40.00",
    subelement: "40 - Serviços de Tecnologia da Informação e Comunicação",
    administrativeProcess: "Sistemas de Informação Orçamentária",
    value: 1679600.00,
  },
  {
    code: "19.001.15.451.0013.2.036",
    organ: "19 - SECRETARIA DE TRANSPORTE E DA MOBILIDADE URBANA",
    budgetUnit: "19.001 - GABINETE DA SECRETARIA DE TRANSPORTES",
    functionName: "Urbanismo",
    subfunction: "Infraestrutura Urbana",
    program: "0013 - MOBILIDADE E SINALIZAÇÃO URBANA",
    action: "2.036 - Manutenção da Sinalização e Trânsito",
    expenseNature: "3.3.90.30.00",
    subelement: "30 - Material de Consumo",
    administrativeProcess: "Sinalização e Segurança Viária",
    value: 1440000.00,
  },
  {
    code: "21.001.09.272.0021.0.003",
    organ: "21 - IPMO",
    budgetUnit: "21.001 - GABINETE DO IPMO",
    functionName: "Previdência Social",
    subfunction: "Previdência do Regime Estatutário",
    program: "0021 - RESERVA PREVIDENCIÁRIA E OPERAÇÕES ESPECIALIZADAS",
    action: "0.003 - Amortização de Passivo Atuarial",
    expenseNature: "9.9.99.99.00",
    subelement: "99 - Reserva de Contingência / Passivo Atuarial",
    administrativeProcess: "Amortização de Passivo Previdenciário",
    value: 400000.00,
  },
];

async function main() {
  console.log("Buscando importação ativa da LOA no banco...");
  const activeImport = await prisma.loaImport.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!activeImport) {
    console.error("Nenhuma importação encontrada no banco de dados.");
    process.exit(1);
  }

  console.log(`Importação encontrada: ${activeImport.id} (${activeImport.fileName})`);

  let addedCount = 0;
  let addedValue = 0;

  for (const record of MISSING_RECORDS) {
    const { code, ...budgetData } = record;

    await prisma.budgetRecord.create({
      data: {
        ...budgetData,
        importId: activeImport.id,
        value: budgetData.value,
      },
    });

    addedCount++;
    addedValue += budgetData.value;
    console.log(`✓ Inserido registro: ${code} - R$ ${budgetData.value.toLocaleString("pt-BR")}`);
  }

  // Update total value and count in LoaImport header
  const updatedImport = await prisma.loaImport.update({
    where: { id: activeImport.id },
    data: {
      recordCount: { increment: addedCount },
      totalValue: { increment: addedValue },
    },
  });

  console.log(`\nImportação atualizada com sucesso!`);
  console.log(`- ID: ${updatedImport.id}`);
  console.log(`- Total de Registros: ${updatedImport.recordCount}`);
  console.log(`- Novo Valor Total LOA: R$ ${Number(updatedImport.totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
