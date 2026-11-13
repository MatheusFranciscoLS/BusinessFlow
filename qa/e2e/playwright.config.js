// @ts-check
import { defineConfig } from "@playwright/test";

// A demonstração roda em hospedagem gratuita: na primeira chamada o servidor pode levar
// cerca de 1 minuto para acordar, por isso os tempos limite são generosos.
export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  expect: { timeout: 60_000 },
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "https://flowbusiness.vercel.app",
    // PW_CHANNEL=msedge usa o Edge instalado, sem baixar o Chromium do Playwright.
    channel: process.env.PW_CHANNEL || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
