export const maskCPFOrCNPJ = (value) => {
  if (!value) return "";
  const numericValue = String(value).replace(/\D/g, "");

  if (numericValue.length <= 11) {
    return numericValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  } else {
    return numericValue
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  }
};

export const maskPhone = (value) => {
  if (!value) return "";
  const numericValue = String(value).replace(/\D/g, "");

  if (numericValue.length <= 10) {
    return numericValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }

  return numericValue
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

export const maskCurrency = (value) => {
  if (value === undefined || value === null) return "";
  const numericValue = String(value).replace(/\D/g, "");

  // Retorna "0,00" se estiver vazio ou zerado, garantindo melhor UX
  if (!numericValue) return "0,00";

  const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return new Intl.NumberFormat("pt-BR", options).format(
    Number(numericValue) / 100,
  );
};

export const unmaskCurrency = (value) => {
  if (!value) return 0;
  // 🔥 BLINDAGEM: Se já for número (ou vier direto do banco), devolve-o imediatamente
  if (typeof value === "number") return value;

  // Se for String, limpa os pontos e vírgulas para guardar no Prisma
  return Number(String(value).replace(/\./g, "").replace(",", "."));
};
