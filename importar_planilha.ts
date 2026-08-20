import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { parseWorkbook } from "./src/lib/parser";

const prisma = new PrismaClient();

async function main() {
  const filePath = "/home/sf01/Downloads/LOA PROPOSTA + APELIDO.xlsx";
  console.log("Lendo arquivo...");
  
  if (!fs.existsSync(filePath)) {
    console.error(`Erro: Arquivo ${filePath} não encontrado.`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(filePath);
  const parsed = parseWorkbook(buffer);
  const numberOrNull = (value: unknown) => {
    const n = Number(value);
    return value === "" || value === null || value === undefined || !Number.isFinite(n) ? null : n;
  };
  const integerOrNull = (value: unknown) => {
    const n = numberOrNull(value);
    return n === null ? null : Math.trunc(n);
  };
  
  if (!parsed.hasRequiredFields) {
    console.error("Erro: A planilha não possui todos os campos obrigatórios.");
    process.exit(1);
  }
  
  if (parsed.missingOrgan) {
    console.error("Erro: Existem registros sem Órgão associado.");
    process.exit(1);
  }

  console.log(`Encontrados ${parsed.records.length} registros válidos.`);
  
  const totalValue = parsed.records.reduce((sum, row) => sum + row.value, 0);
  
  console.log("Iniciando importação no banco de dados local...");
  const imported = await prisma.$transaction(async (tx) => {
    const batch = await tx.loaImport.create({
      data: {
        fileName: "LOA PROPOSTA + APELIDO.xlsx",
        recordCount: parsed.records.length,
        totalValue: totalValue,
      }
    });

    for (let start = 0; start < parsed.records.length; start += 1000) {
      await tx.budgetRecord.createMany({
        data: parsed.records.slice(start, start + 1000).map((row) => ({
          ...row,
          importId: batch.id,
          value: row.value,
        })),
      });
      console.log(`Importado lote ${start} a ${Math.min(start + 1000, parsed.records.length)}...`);
    }
    if (parsed.contracts.length) {
      await tx.contract.createMany({
        data: parsed.contracts.map((row) => ({
          ...row,
          importId: batch.id,
          valorContratual: numberOrNull(row.valorContratual),
          valor12Meses: numberOrNull(row.valor12Meses),
          loaProposta: numberOrNull(row.loaProposta),
          diferenca: numberOrNull(row.diferenca),
          qtdProgramaticas: integerOrNull(row.qtdProgramaticas),
          mesesContrato: integerOrNull(row.mesesContrato),
          mesesRestantes: integerOrNull(row.mesesRestantes),
          quantidadePA: integerOrNull(row.quantidadePA),
          inicioContrato: row.inicioContrato ? new Date(String(row.inicioContrato)) : null,
          vencimentoContrato: row.vencimentoContrato ? new Date(String(row.vencimentoContrato)) : null,
        })),
      });
      console.log(`Importados ${parsed.contracts.length} contratos...`);
    }
    return batch;
  });

  console.log(`\nSucesso! Importação concluída.`);
  console.log(`- ID da Importação: ${imported.id}`);
  console.log(`- Linhas importadas: ${imported.recordCount}`);
  console.log(`- Valor total: R$ ${Number(imported.totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
}

main()
  .catch((e) => {
    console.error("Erro na importação:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
