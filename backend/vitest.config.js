import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    globalSetup: ["tests/global-setup.js"],
    // Todos os testes usam o mesmo banco, então rodam um arquivo por vez.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    env: {
      JWT_SECRET: "segredo-so-para-testes",
      NODE_ENV: "test",
      // Em produção o cadastro é fechado por padrão; os testes de cadastro precisam dele aberto.
      ALLOW_PUBLIC_REGISTRATION: "true",
    },
  },
});
