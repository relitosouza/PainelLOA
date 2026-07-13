import { expect, test } from "@playwright/test";

test.describe("Filtros da análise", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("filters-panel")).toBeVisible();
  });

  test("permite selecionar, refinar e limpar filtros sem quebrar o layout", async ({ page }) => {
    const panel = page.getByTestId("filters-panel");
    const total = page.getByTestId("filters-total");
    const activeCount = page.getByTestId("filters-active-count");
    const clearButton = page.getByTestId("filters-clear");
    const toggle = page.getByTestId("filters-advanced-toggle");

    await expect(panel).toBeVisible();
    await expect(clearButton).toBeDisabled();

    const totalBefore = (await total.textContent()) ?? "";

    await page.getByTestId("filter-organ-summary").click();
    await expect(page.getByTestId("filter-organ-select")).toHaveAttribute("open", "");

    const firstOrganOption = page.getByTestId("filter-organ-option-0");
    const selectedOrgan = (await firstOrganOption.locator("span").first().textContent()) ?? "";
    await firstOrganOption.locator('input[type="checkbox"]').check();

    await expect(page.getByTestId("filter-organ-summary")).toContainText("1 selecionado");
    await expect(activeCount).toBeVisible();
    await expect(clearButton).toBeEnabled();
    await expect(total).not.toHaveText(totalBefore);

    await toggle.click();
    await expect(page.getByTestId("filters-min")).toBeVisible();
    await expect(page.getByTestId("filters-max")).toBeVisible();

    await page.getByTestId("filters-min").fill("1000000");
    await page.getByTestId("filters-max").fill("9000000");

    await expect(activeCount).toContainText("3 filtros ativos");
    await expect(panel).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

    await clearButton.click();

    await expect(page.getByTestId("filter-organ-summary")).toContainText("Todos");
    await expect(clearButton).toBeDisabled();
    await expect(activeCount).toHaveCount(0);
    await expect(total).toHaveText(totalBefore);

    if (selectedOrgan) {
      await expect(page.getByTestId("filters-status")).toContainText("registros encontrados");
    }
  });

  test("mostra mais de uma secretaria selecionada no modo simulado", async ({ page }) => {
    const organSummary = page.getByTestId("filter-organ-summary");
    const organSearch = page.getByTestId("filter-organ-search");
    const selectedPreview = page.getByTestId("filter-organ-selected-preview");

    await organSummary.click();
    await organSearch.fill("educação");
    await expect(page.getByTestId("filter-organ-options")).toContainText("SECRETARIA DA EDUCAÇÃO");
    await page.getByTestId("filter-organ-option-0").locator('input[type="checkbox"]').check();

    await expect(selectedPreview).toContainText("SECRETARIA DA EDUCAÇÃO");
    await expect(organSummary).toContainText("1 selecionado");

    await organSearch.fill("saúde");
    await expect(page.getByTestId("filter-organ-options")).toContainText("SECRETARIA DA SAÚDE");
    await page.getByTestId("filter-organ-option-0").locator('input[type="checkbox"]').check();

    await expect(selectedPreview).toContainText("SECRETARIA DA EDUCAÇÃO");
    await expect(selectedPreview).toContainText("SECRETARIA DA SAÚDE");
    await expect(organSummary).toContainText("2 selecionados");
    await expect(page.getByTestId("filters-active-count")).toContainText("2 filtros ativos");

    await page.getByTestId("filter-organ-selected-chip-0").click();

    await expect(selectedPreview).not.toContainText("SECRETARIA DA EDUCAÇÃO");
    await expect(selectedPreview).toContainText("SECRETARIA DA SAÚDE");
    await expect(organSummary).toContainText("1 selecionado");
    await expect(page.getByTestId("filters-active-count")).toContainText("1 filtro ativo");
  });

  test("mantém o painel usável em viewport estreita", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByTestId("filters-panel")).toBeVisible();
    await expect(page.getByTestId("filters-advanced-toggle")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });
});
