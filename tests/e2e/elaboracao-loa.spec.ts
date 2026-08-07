import { expect, test } from "@playwright/test";

test.describe("Enquadramento LDO → LOA", () => {
  test("carrega ações, seleciona contexto e exibe catálogo de enquadramento", async ({ page }) => {
    await page.goto("/elaboracao-loa");
    await expect(page.getByRole("heading", { name: "Enquadramento LDO → LOA" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ações da LDO" })).toBeVisible();
    await expect(page.getByText(/525 ações/)).toBeVisible();
    await expect(page.getByText("Ação selecionada")).toBeVisible();
    await expect(page.getByLabel("Buscar despesa ou subelemento")).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar enquadramento" })).toBeDisabled();
  });

  test("filtra ações por status", async ({ page }) => {
    await page.goto("/elaboracao-loa");
    await page.getByLabel("Filtrar por status").selectOption("PENDENTE");
    await expect(page.getByText("Pendente de vínculo").first()).toBeVisible();
  });
});
