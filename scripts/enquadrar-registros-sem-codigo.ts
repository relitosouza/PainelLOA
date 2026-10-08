import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Iniciando enquadramento dos 55 registros sem códigos funcionais...");

  const records = await db.budgetRecord.findMany({
    where: { functionName: "" },
    orderBy: { id: "asc" }
  });

  console.log(`Encontrados ${records.length} registros para atualizar.`);

  let updatedCount = 0;

  for (const r of records) {
    const org = r.organ;
    const act = r.action;
    let unit = r.budgetUnit;
    let func = "";
    let sub = "";
    let prog = "";
    let action = r.action;

    if (org.includes("EDUCAÇÃO")) {
      unit = "001 - GABINETE DA SECRETARIA DA EDUCAÇÃO";
      func = "12";
      if (act.includes("Novo Chamamento") || act.includes("Escola do Futuro")) {
        sub = "361";
        prog = "0016";
        action = `1.003 - Implantação de Novas Unidades - ${act}`;
      } else if (act.includes("Comgas") || act.includes("Sala de transição")) {
        sub = "361";
        prog = "0016";
        action = `2.011 - Manutenção de Equipamentos Públicos - ${act}`;
      } else if (act.includes("Lousas Digitais")) {
        sub = "361";
        prog = "0016";
        action = `2.018 - Conectividade e Tecnologia na Educação - ${act}`;
      } else if (act.includes("Reforma de 50 unidades")) {
        sub = "361";
        prog = "0016";
        action = `1.002 - Reforma e Ampliação de Unidades - ${act}`;
      } else if (act.includes("carrinhos com tablets")) {
        sub = "365";
        prog = "0016";
        action = `2.018 - Conectividade e Tecnologia na Educação - ${act}`;
      } else {
        sub = "361";
        prog = "0016";
        action = `2.011 - Manutenção de Equipamentos Públicos - ${act}`;
      }
    } else if (org.includes("ASSISTÊNCIA SOCIAL")) {
      func = "08";
      prog = "0018";
      if (act.includes("Censo")) {
        func = "04";
        sub = "121";
        prog = "0004";
        unit = "001 - GABINETE DA SECRETARIA DE ASSISTÊNCIA SOCIAL";
        action = `1.001 - Estudos, Pesquisas, Planos e Projetos - ${act}`;
      } else if (act.includes("CRAS") && act.includes("Reforma")) {
        unit = "001 - GABINETE DA SECRETARIA DE ASSISTÊNCIA SOCIAL";
        sub = "245";
        action = `1.002 - Reforma e Ampliação de Unidades - ${act}`;
      } else if (act.includes("CRAS") || act.includes("CREAS")) {
        unit = "007 - DEPARTAMENTO DE PROTEÇÃO SOCIAL BÁSICA";
        sub = "245";
        action = `1.003 - Implantação de Novas Unidades - ${act}`;
      } else if (
        act.includes("Pessoa Idosa") ||
        act.includes("Idosa") ||
        act.includes("Pessoa com deficiência") ||
        act.includes("Residência inclusiva")
      ) {
        unit = "005 - FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL";
        sub = "241";
        action = `2.015 - Manutenção de Equipamentos Públicos - Proteção Básica - ${act}`;
      } else if (act.includes("Benefícios Eventuais")) {
        unit = "005 - FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL";
        sub = "246";
        action = `2.024 - Distribuição de Alimentos e Benefícios para as Famílias em Situação de Vulnerabilidade - ${act}`;
      } else if (
        act.includes("ABORDAGEM NOTURNA") ||
        act.includes("SAICA") ||
        act.includes("SAI ") ||
        act.includes("CENTRO POP")
      ) {
        unit = "008 - DEPARTAMENTO DE PROTEÇÃO SOCIAL ESPECIAL";
        sub = "245";
        action = `2.016 - Manutenção de Equipamentos Públicos - Proteção Especial - ${act}`;
      } else {
        unit = "005 - FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL";
        sub = "245";
        action = `2.015 - Manutenção de Equipamentos Públicos - Proteção Básica - ${act}`;
      }
    } else if (org.includes("CULTURA")) {
      unit = "001 - GABINETE DA SECRETARIA DE CULTURA";
      func = "13";
      sub = "392";
      prog = "0009";
      action = `2.023 - Gestão Compartilhada de Equipamentos Públicos - ${act}`;
    } else if (org.includes("TECNOLOGIA, INOVAÇÃO")) {
      unit = "001 - GABINETE DA SECRETARIA DE TECNOLOGIA, INOVAÇÃO E DESENVOLVIMENTO ECONÔMICO";
      func = "23";
      sub = "334";
      prog = "0008";
      action = `2.011 - Manutenção de Equipamentos Públicos - ${act}`;
    } else if (org.includes("MEIO AMBIENTE")) {
      unit = "001 - GABINETE DA SECRETARIA DE MEIO AMBIENTE E RECURSOS HÍDRICOS";
      func = "18";
      sub = "541";
      prog = "0007";
      if (act.includes("Construção")) {
        action = `1.003 - Implantação de Novas Unidades - ${act}`;
      } else if (act.includes("Reforma")) {
        action = `1.002 - Reforma e Ampliação de Unidades - ${act}`;
      } else {
        action = `2.011 - Manutenção de Equipamentos Públicos - ${act}`;
      }
    } else if (org.includes("ENCARGOS/TECNOLOGIA")) {
      unit = "003 - RECURSOS SOB A SUPERVISÃO DA SECRETARIA DE TECNOLOGIA, INOVAÇÃO E DESENVOLVIMENTO ECONÔMICO";
      func = "04";
      sub = "126";
      prog = "0002";
      action = `2.007 - Ampliação e Manutenção de Sistemas de Inteligência, Fiscalização e Tecnologia - ${act}`;
    } else if (org.includes("DEFESA CIVIL")) {
      unit = "001 - GABINETE DA COORDENADORIA DA DEFESA CIVIL";
      func = "15";
      sub = "182";
      prog = "0005";
      if (act.includes("Habitacionais")) {
        action = `1.002 - Reforma e Ampliação de Unidades - ${act}`;
      } else {
        action = `2.011 - Manutenção de Equipamentos Públicos - ${act}`;
      }
    }

    await db.budgetRecord.update({
      where: { id: r.id },
      data: {
        budgetUnit: unit,
        functionName: func,
        subfunction: sub,
        program: prog,
        action: action,
      },
    });

    updatedCount++;
  }

  console.log(`Sucesso: ${updatedCount} registros foram enquadrados com códigos funcionais e unidade orçamentária.`);
}

main()
  .catch((err) => {
    console.error("Erro ao atualizar registros:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
