// @ts-check
import { test, expect } from "@playwright/test";

// CT-E2E-01: a página de entrada oferece a demonstração e o gestor entra sem senha.
test("gestor entra na demonstração e vê o aviso de somente leitura", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Quer só conhecer o sistema?")).toBeVisible();

  await page.getByRole("button", { name: "Como gestor do escritório" }).click();

  await expect(page.getByText(/Modo demonstração: dados fictícios e somente leitura/)).toBeVisible();
  await expect(page.getByText("Ana Souza (demo)")).toBeVisible();
});

// CT-E2E-02: o gestor consegue navegar para os resultados (DRE) e o menu completo aparece.
test("gestor navega até Resultados (DRE) e vê o menu de gestão", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Como gestor do escritório" }).click();
  await expect(page.getByText(/Modo demonstração/)).toBeVisible();

  for (const item of ["Clientes (CRM)", "Financeiro", "Equipe", "Segurança (Logs)"]) {
    await expect(page.getByText(item, { exact: true }).first()).toBeVisible();
  }

  await page.getByText("Resultados (DRE)", { exact: true }).click();
  // A rota da página de DRE chama-se "servicos" (nome herdado; ver observação OBS-01 nos casos de teste).
  await expect(page).toHaveURL(/#\/app\/servicos/);
  await expect(page.getByRole("heading", { name: "Análise de Dados e DRE" })).toBeVisible();
});

// CT-E2E-03: o cliente (portal) não vê os menus de gestão do escritório.
test("cliente do portal não vê Equipe nem Segurança (Logs)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Como cliente (portal)" }).click();
  await expect(page.getByText(/Modo demonstração/)).toBeVisible();

  await expect(page.getByText("Equipe", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Segurança (Logs)", { exact: true })).toHaveCount(0);
});
