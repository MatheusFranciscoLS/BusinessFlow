// Dinheiro: os valores ficam com 2 casas, e as somas são feitas em centavos
// inteiros, para 0,1 + 0,2 dar 0,30 e não 0,30000000000000004.

// Valor em centavos inteiros, arredondando "meio centavo" para cima.
// Usa notação "e2" em vez de multiplicar por 100, porque 10.555 * 100 dá 1055.4999...
function toCents(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return NaN;
  const sign = number < 0 ? -1 : 1;
  const shifted = Number(`${Math.abs(number)}e2`);
  const cents = Number.isNaN(shifted) ? Math.abs(number) * 100 : shifted; // números muito pequenos, em notação científica
  return sign * Math.round(cents);
}

// Converte para número com 2 casas. Aceita número ou texto ("10.5" ou "10,50").
// Devolve null se não for um valor válido.
export function parseMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = typeof value === "string" ? value.trim().replace(",", ".") : value;
  if (text === "") return null;
  const cents = toCents(text);
  return Number.isFinite(cents) ? cents / 100 : null;
}

// Soma uma lista de valores em centavos inteiros.
export function sumMoney(values) {
  const cents = values.reduce((total, value) => total + (toCents(value) || 0), 0);
  return cents / 100;
}

export const round2 = (value) => (toCents(value) || 0) / 100;
