import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== POPULANDO O BANCO DE DADOS A PARTIR DA PLANILHA REAL LOA_NEW.XLSX ===");

  const wb = XLSX.readFile("./public/loa_new.xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  const activeLoaImport = await prisma.loaImport.findFirst({ orderBy: { createdAt: "desc" } });
  if (!activeLoaImport) {
    console.error("Nenhuma importação LOA encontrada.");
    process.exit(1);
  }

  // Deletar registros anteriores (incluindo placeholders genéricos)
  await prisma.budgetRecord.deleteMany({ where: { importId: activeLoaImport.id } });

  let insertedCount = 0;
  let totalLoaValue = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const peca = String(r[18] || "").trim();
    if (peca !== "LOA") continue; // Apenas dotações da LOA

    let organStr = String(r[8] || "").trim().replace(/^\.+/, "");
    organStr = organStr.replace(/^(\d+)\s*-\s*/, (m, code) => `${code.padStart(2, "0")} - `);
    if (organStr === "01 - CMO" || organStr === "01- CMO") organStr = "01 - CMO";

    const unitStr = String(r[9] || "").trim().replace(/^\.+/, "");
    const functionStr = String(r[10] || "").trim().replace(/^\.+/, "");
    const subfunctionStr = String(r[11] || "").trim().replace(/^\.+/, "");
    const programStr = String(r[12] || "").trim().replace(/^\.+/, "");
    const actionStr = String(r[13] || "").trim().replace(/^\.+/, "");
    let natureStr = String(r[14] || "").trim().replace(/^\.+/, "").replace(/\.\./g, ".");
    natureStr = natureStr
      .replace(/^3\.50\.39/, "3.3.50.39")
      .replace(/^3\.90\.35/, "3.3.90.35")
      .replace(/^4\.90\.52/, "4.4.90.52");
    const subelemStr = String(r[15] || "").trim().replace(/^\.+/, "");
    const processStr = String(r[16] || "").trim().replace(/^\.+/, "");
    const valor = Number(r[17]) || 0;

    await prisma.budgetRecord.create({
      data: {
        importId: activeLoaImport.id,
        organ: organStr,
        budgetUnit: unitStr || `${organStr} - Unidade`,
        functionName: functionStr || "Administração Geral",
        subfunction: subfunctionStr || "Gestão Orçamentária",
        program: programStr,
        action: actionStr,
        expenseNature: natureStr,
        subelement: subelemStr,
        administrativeProcess: processStr || "—",
        value: valor,
      },
    });

    insertedCount++;
    totalLoaValue += valor;
  }

  await prisma.loaImport.update({
    where: { id: activeLoaImport.id },
    data: {
      recordCount: insertedCount,
      totalValue: totalLoaValue,
    },
  });

  console.log(`\n✅ ${insertedCount} dotações reais da LOA inseridas no banco! Total LOA: R$ ${totalLoaValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);

  // Atualizar também LDO
  const activeLdoImport = await prisma.ldoAcaoImportacao.findFirst({ where: { ativo: true }, orderBy: { criadoEm: "desc" } });
  if (activeLdoImport) {
    await prisma.ldoAcao.deleteMany({ where: { importacaoId: activeLdoImport.id } });

    let ldoCount = 0;
    let totalLdoValue = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;

      const peca = String(r[18] || "").trim();
      if (peca !== "LDO") continue;

      let organStr = String(r[8] || "").trim().replace(/^\.+/, "");
      organStr = organStr.replace(/^(\d+)\s*-\s*/, (m, code) => `${code.padStart(2, "0")} - `);
      if (organStr === "01 - CMO" || organStr === "01- CMO") organStr = "01 - CMO";

      const programStr = String(r[12] || "").trim().replace(/^\.+/, "");
      const actionStr = String(r[13] || "").trim().replace(/^\.+/, "");
      const actionCodeMatch = actionStr.match(/^(\d+(?:\.[\d.]+)?)/);
      const actionCode = actionCodeMatch ? actionCodeMatch[1] : actionStr.split("-")[0].trim();
      const actionName = actionStr.includes("-") ? actionStr.split("-").slice(1).join("-").trim() : actionStr;
      const valor = Number(r[17]) || 0;

      await prisma.ldoAcao.create({
        data: {
          importacaoId: activeLdoImport.id,
          exercicio: activeLdoImport.exercicio,
          secretaria: organStr,
          programaCodigo: programStr.split("-")[0].trim(),
          programaNome: programStr,
          acaoCodigo: actionCode,
          acaoNome: actionName,
          produto: "Ação LDO Importada",
          custoFinanceiro: valor,
        },
      });

      ldoCount++;
      totalLdoValue += valor;
    }

    await prisma.ldoAcaoImportacao.update({
      where: { id: activeLdoImport.id },
      data: {
        quantidade: ldoCount,
        valorTotal: totalLdoValue,
      },
    });

    console.log(`\n✅ ${ldoCount} ações reais da LDO inseridas no banco! Total LDO: R$ ${totalLdoValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
