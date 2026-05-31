// frontend/src/utils/masks.js

export const maskCPFOrCNPJ = (value) => {
  if (!value) return "";
  const numericValue = value.replace(/\D/g, ""); // Remove tudo o que não for número

  if (numericValue.length <= 11) {
    // Máscara de CPF: 000.000.000-00
    return numericValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  } else {
    // Máscara de CNPJ: 00.000.000/0001-00
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
  const numericValue = value.replace(/\D/g, "");

  if (numericValue.length <= 10) {
    return numericValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }

  return numericValue
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1"); // Limita a 11 dígitos no máximo (Celular)
};

export const maskCurrency = (value) => {
  if (!value) return "";
  const numericValue = value.replace(/\D/g, "");

  const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  const result = new Intl.NumberFormat("pt-BR", options).format(
    numericValue / 100,
  );

  return result === "0,00" ? "" : result;
};

export const unmaskCurrency = (value) => {
  if (!value) return 0;
  // Transforma "1.500,00" -> 1500.00 para salvar no Banco
  return Number(value.replace(/\./g, "").replace(",", "."));
};
