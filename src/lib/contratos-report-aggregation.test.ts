import { describe, expect, it } from "vitest";
import type { LoaReportGroup, LoaReportItem } from "./loa-report-template";
import { aggregateContractReportGroups } from "./contratos-report-aggregation";

const contractItem = (overrides: Partial<LoaReportItem>): LoaReportItem => ({
  natureza: "3.3.90.39.00",
  vinculo: "01.110.0000",
  processo: "19942/2020",
  isContrato: true,
  valLoa: 100,
  valorReajuste: 10,
  valorAditamento: 5,
  valorAjusteSf: 2,
  valorCorteGp: -1,
  valorTotal: 116,
  ...overrides,
});

const group = (action: string, items: LoaReportItem[]): LoaReportGroup => ({
  groupCode: action,
  groupTitle: action,
  secretaria: "Secretaria de Obras",
  valLdo: 0,
  valLoa: 0,
  valorReajuste: 0,
  valorAditamento: 0,
  valorAjusteSf: 0,
  valorCorteGp: 0,
  valorTotal: 0,
  items,
});

describe("aggregateContractReportGroups", () => {
  it("soma o contrato 19942/2020 separado por vínculos quando vínculo é ocultado", () => {
    const result = aggregateContractReportGroups(
      [
        group("2042", [
          contractItem({ vinculo: "01.110.0000" }),
          contractItem({ vinculo: "05.100.0000", valLoa: 250, valorTotal: 266 }),
        ]),
      ],
      { ocultarAcao: false, ocultarNatureza: false, ocultarVinculo: true }
    );

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0]).toMatchObject({
      processo: "19942/2020",
      vinculo: undefined,
      valLoa: 350,
      valorReajuste: 20,
      valorAditamento: 10,
      valorAjusteSf: 4,
      valorCorteGp: -2,
      valorTotal: 382,
    });
    expect(result[0].valorTotal).toBe(382);
  });

  it("soma registros separados por natureza quando natureza é ocultada", () => {
    const result = aggregateContractReportGroups(
      [
        group("2042", [
          contractItem({ natureza: "3.3.90.39.00" }),
          contractItem({ natureza: "4.4.90.51.00", valLoa: 200, valorTotal: 216 }),
        ]),
      ],
      { ocultarAcao: false, ocultarNatureza: true, ocultarVinculo: false }
    );

    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0]).toMatchObject({ natureza: "—", valLoa: 300, valorTotal: 332 });
  });

  it("soma registros separados por ação quando ação é ocultada", () => {
    const result = aggregateContractReportGroups(
      [
        group("2042", [contractItem({})]),
        group("2199", [contractItem({ valLoa: 400, valorTotal: 416 })]),
      ],
      { ocultarAcao: true, ocultarNatureza: false, ocultarVinculo: false }
    );

    expect(result).toHaveLength(1);
    expect(result[0].groupTitle).toBe("Contratos consolidados");
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0]).toMatchObject({ valLoa: 500, valorTotal: 532 });
  });

  it("mantém linhas distintas pelas dimensões que continuam visíveis", () => {
    const result = aggregateContractReportGroups(
      [
        group("2042", [
          contractItem({ vinculo: "01.110.0000" }),
          contractItem({ vinculo: "05.100.0000" }),
        ]),
      ],
      { ocultarAcao: false, ocultarNatureza: false, ocultarVinculo: false }
    );

    expect(result[0].items).toHaveLength(2);
  });
});
