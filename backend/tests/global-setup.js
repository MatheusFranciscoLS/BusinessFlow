// Trava de segurança: os testes apagam dados. Só rodam em um banco cujo nome
// tenha "test", para nunca encostar no banco de verdade por engano.
export default function setup() {
  const url = process.env.DATABASE_URL || "";
  const dbName = url.split("/").pop()?.split("?")[0] || "";

  if (!/test/i.test(dbName)) {
    throw new Error(
      `Recusei rodar os testes: DATABASE_URL aponta para "${dbName || "(vazio)"}". ` +
        `Use um banco só de testes, com "test" no nome (ex.: businessflow_test).`,
    );
  }
}
