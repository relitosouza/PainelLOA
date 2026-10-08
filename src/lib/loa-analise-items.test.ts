import { describe, expect, it } from "vitest";
import { applyAnaliseLoaSavedData, buildAnaliseLoaItems, mergeImportedLoaValues, resolveAddedExpenses, type RawBudgetItem } from "./loa-analise-items";

const header = ["secretaria", "unidade", "programa", "acao", "natureza", "desc_sub", "processo", "valor", "Peça Orçamentária", "Vínculo"];
const row = (peca: string, valor: number, sub = "MATERIAL") =>
  ["08 - SECRETARIA DE EDUCAÇÃO", "001", "0001 - Programa", "2.001 - Ação", "3.3.90.30.00", sub, "", valor, peca, "01.200.0000"];

describe("buildAnaliseLoaItems", () => {
  it("agrega LOA e LDO da mesma dotação num único item, com LDO arredondada a centavos", () => {
    const items = buildAnaliseLoaItems([header, row("LOA", 100), row("LOA", 50), row("LDO", 80.004)], {});
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ valLoa: 150, valLdo: 80, fonteVinculo: "01", codigoAplicacao: "200.0000" });
  });
});

describe("applyAnaliseLoaSavedData", () => {
  it("aplica exclusões e edições, e move o Banco de Projetos para Aditamento depois dos reajustes salvos", () => {
    const base = buildAnaliseLoaItems([header, row("LOA", 100, "A"), row("LOA", 40, "B")], {});
    const projeto = { ...base[0], id: "banco-projeto-1", origem: "Banco de Projetos", valLoa: 500 } as RawBudgetItem;
    const [a, b] = base;
    const result = applyAnaliseLoaSavedData(base, {
      addedExpenses: [projeto],
      removedIds: [b.id],
      customEdits: { [a.id]: 120 },
      financialEdits: { [a.id]: { valorReajuste: 10 }, [projeto.id]: { valorReajuste: 0, valorAditamento: 0 } },
    });
    expect(result.map((item) => [item.id, item.valLoa, item.valorReajuste ?? 0, item.valorAditamento ?? 0])).toEqual([
      [a.id, 120, 10, 0],
      ["banco-projeto-1", 0, 0, 500],
    ]);
  });

  it("não duplica o aditamento de um projeto já normalizado e persistido", () => {
    const base = buildAnaliseLoaItems([header, row("LOA", 100)], {});
    const projeto = {
      ...base[0],
      id: "banco-projeto-persistido",
      origem: "Banco de Projetos",
      valLoa: 500,
      valorAditamento: 0,
    } as RawBudgetItem;

    const result = applyAnaliseLoaSavedData(base, {
      addedExpenses: [projeto],
      customEdits: { [projeto.id]: 500 },
      financialEdits: { [projeto.id]: { valorAditamento: 500 } },
    });

    expect(result.find((item) => item.id === projeto.id)).toMatchObject({
      valLoa: 0,
      valorAditamento: 500,
    });
  });
});

describe("mergeImportedLoaValues", () => {
  it("substitui a LOA antiga pelos valores da importação e mantém a LDO", () => {
    const base = buildAnaliseLoaItems([header, row("LOA", 100), row("LDO", 80)], {});
    const merged = mergeImportedLoaValues(base, [{
      organ: "08 - SECRETARIA DE EDUCAÇÃO",
      budgetUnit: "001",
      program: "0001",
      action: "2.001 - Ação",
      expenseNature: "3.3.90.30.00",
      subelement: "MATERIAL",
      fonteRecurso: "01.200.0000",
      administrativeProcess: "—",
      value: 250,
    }], {});

    expect(merged.reduce((sum, item) => sum + item.valLoa, 0)).toBe(250);
    expect(merged.reduce((sum, item) => sum + item.valLdo, 0)).toBe(80);
  });

  it("mescla registros importados com traço ou vazio ('—', '') no mesmo item base e assume descrição canônica do programa", () => {
    const base = buildAnaliseLoaItems([header, row("LDO", 15000, "")], {});
    const merged = mergeImportedLoaValues(base, [{
      organ: "08 - SECRETARIA DE EDUCAÇÃO",
      budgetUnit: "001",
      program: "0001",
      action: "2.001",
      expenseNature: "3.3.90.30.00",
      subelement: "—",
      fonteRecurso: "01.200.0000",
      administrativeProcess: "—",
      value: 12000,
    }], {});

    expect(merged).toHaveLength(1);
    expect(merged[0].valLdo).toBe(15000);
    expect(merged[0].valLoa).toBe(12000);
    expect(merged[0].programa).toBe("0001 - Administração e Coordenação Geral");
  });
});

describe("resolveAddedExpenses", () => {
  it("usa a configuração do servidor como fonte autoritativa quando ela foi carregada", () => {
    const base = buildAnaliseLoaItems([header, row("LOA", 100)], {});
    const servidor = [{ ...base[0], id: "servidor" }];
    const local = [{ ...base[0], id: "obsoleto-local" }];

    expect(resolveAddedExpenses(servidor, local, true).map((item) => item.id)).toEqual(["servidor"]);
  });
});
