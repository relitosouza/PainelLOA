import { describe, expect, it } from "vitest";
import { EMPTY_DASHBOARD_FILTERS, buildDemoDashboardData } from "./dashboard-data";

describe("buildDemoDashboardData", () => {
  it("aplica filtros no modo simulado", () => {
    const data = buildDemoDashboardData({
      ...EMPTY_DASHBOARD_FILTERS,
      functionName: ["Saúde"],
    });

    expect(data.totals.filtered).toBe(975_000_000);
    expect(data.pagination.total).toBe(4);
    expect(data.records).toHaveLength(4);
    expect(data.records.every((row) => row.functionName === "Saúde")).toBe(true);
  });

  it("respeita busca textual e faixa de valor", () => {
    const data = buildDemoDashboardData({
      ...EMPTY_DASHBOARD_FILTERS,
      search: "hospital",
      min: "300000000",
      max: "400000000",
    });

    expect(data.records).toHaveLength(1);
    expect(data.records[0]?.action).toContain("Serviços Hospitalares");
    expect(data.totals.filtered).toBe(310_000_000);
  });
});
