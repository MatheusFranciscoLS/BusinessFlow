import app from "./app.js";

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando lindamente na porta ${PORT}`);
});

// Desligamento gracioso (Padrão Enterprise)
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM recebido. Fechando servidor...");
  server.close(() => {
    process.exit(0);
  });
});
