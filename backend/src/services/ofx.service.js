import crypto from "crypto";

// Leitura de extrato bancário OFX (os formatos 1.x, em SGML, e 2.x, em XML).
// Funções puras: recebem os bytes do arquivo e devolvem os movimentos.

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&#39;": "'" };

const decodeEntities = (text) => text.replace(/&(amp|lt|gt|quot|apos|#39);/g, (e) => ENTITIES[e]);

// Bancos brasileiros costumam mandar Windows-1252; os novos mandam UTF-8.
export function decodeOfx(buffer) {
  const head = buffer.subarray(0, 800).toString("latin1");
  const declaredUtf8 = /(ENCODING:\s*UTF-?8|CHARSET:\s*UTF-?8)/i.test(head);
  const utf8 = buffer.toString("utf8");
  if (declaredUtf8 || !utf8.includes("�")) return utf8;

  try {
    return new TextDecoder("windows-1252").decode(buffer);
  } catch {
    return buffer.toString("latin1");
  }
}

// Valor de uma tag, tanto em <TAG>valor quanto em <TAG>valor</TAG>.
function tagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}>[ \\t]*([^<\\r\\n]*)`, "i"));
  if (!match) return null;
  const value = decodeEntities(match[1].trim());
  return value === "" ? null : value;
}

// DTPOSTED: AAAAMMDD, às vezes com hora e fuso. Usa só o dia, ao meio-dia UTC,
// para o fuso não empurrar o lançamento para o dia anterior ou seguinte.
export function parseOfxDate(raw) {
  const match = raw?.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const valid = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return valid ? date : null;
}

// TRNAMT: o padrão é ponto decimal, mas alguns bancos mandam vírgula ("1.234,56").
export function parseOfxAmount(raw) {
  if (!raw) return null;
  let text = raw.replace(/\s/g, "");
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma > lastDot) text = text.replace(/\./g, "").replace(",", ".");
  else text = text.replace(/,/g, "");

  if (!/^[+-]?\d+(\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

export function parseOfx(buffer) {
  const content = decodeOfx(buffer);
  if (!/OFXHEADER|<OFX>/i.test(content)) {
    throw new Error("Este arquivo não parece ser um extrato OFX.");
  }

  const bankId = tagValue(content, "BANKID");
  const accountId = tagValue(content, "ACCTID");
  const blocks = content.matchAll(/<STMTTRN>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|$)/gi);

  const transactions = [];
  const seen = new Map(); // quantas vezes cada identificador já apareceu neste arquivo

  for (const [, block] of blocks) {
    const date = parseOfxDate(tagValue(block, "DTPOSTED"));
    const signed = parseOfxAmount(tagValue(block, "TRNAMT"));
    if (!date || signed === null || signed === 0) continue;

    const description = tagValue(block, "MEMO") || tagValue(block, "NAME") || "Movimento Bancário";
    const fitId = tagValue(block, "FITID");

    // Identificador estável: o FITID do banco; sem ele, um hash do conteúdo.
    // Movimentos idênticos no mesmo arquivo ganham um número de ordem.
    const base = fitId
      ? `${bankId ?? ""}|${accountId ?? ""}|${fitId}`
      : `${date.toISOString().slice(0, 10)}|${signed}|${description}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    const key = fitId && count === 1 ? base : `${base}|${count}`;
    const id = "ofx-" + crypto.createHash("sha1").update(key).digest("hex").slice(0, 16);

    transactions.push({
      id,
      fitId,
      bankId,
      accountId,
      type: signed >= 0 ? "entrada" : "saida",
      date,
      amount: Math.abs(signed),
      description,
    });
  }

  return transactions;
}
