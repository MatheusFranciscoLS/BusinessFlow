// A API fica numa hospedagem gratuita que "dorme" quando não é usada: a primeira
// chamada pode levar cerca de 1 minuto ou falhar com 502/503/504. Essas funções
// separam "o servidor está acordando" (esperar e tentar de novo) de um erro real.

export function isApiWaking(err) {
  if (!err) return false;
  if (!err.response) return true; // sem resposta: rede, tempo esgotado ou servidor ainda iniciando
  return [502, 503, 504].includes(err.response.status);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retryWhileWaking(action, { attempts = 8, delayMs = 5000, onWait = () => {}, wait = sleep } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await action();
    } catch (err) {
      if (!isApiWaking(err) || attempt >= attempts) throw err;
      onWait(attempt, attempts);
      await wait(delayMs);
    }
  }
}
