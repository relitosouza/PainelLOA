import { expect, test } from "@playwright/test";

test.describe("Enquadramento LDO → LOA", () => {
  test("exibe os cards de resumo orçamentário", async ({ page }) => {
    await page.goto("/elaboracao-loa");
    await expect(page.getByRole("heading", { name: "Enquadramento LDO → LOA" })).toBeVisible();
    const resumo = page.getByRole("region", { name: "Resumo orçamentário" });
    for (const label of ["LDO Despesa", "LOA Receita", "LOA Despesa Proposta", "Déficit"]) {
      await expect(resumo.getByText(label, { exact: true })).toBeVisible();
    }
  });
});
