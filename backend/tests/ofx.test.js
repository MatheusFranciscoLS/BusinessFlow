import { describe, it, expect, beforeAll } from "vitest";
import { api, resetDatabase, createOffice, createPortalUser, authHeaders } from "./helpers.js";
import { parseOfx, parseOfxDate, parseOfxAmount } from "../src/services/ofx.service.js";

// Extrato no formato antigo (SGML, sem tags de fechamento), como os bancos brasileiros mandam.
const sgml = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
ENCODING:USASCII
CHARSET:1252

<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS>
<BANKACCTFROM><BANKID>0341<ACCTID>12345-6</BANKACCTFROM>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20261002120000[-3:BRT]
<TRNAMT>1500.00
<FITID>2026100201
<MEMO>PIX RECEBIDO JOÃO
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261005
<TRNAMT>-89,90
<FITID>2026100502
<MEMO>TARIFA PACOTE SERVIÇOS
</STMTTRN>
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>`;

// Formato novo (XML, com tags de fechamento e UTF-8).
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="211"?>
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS>
<BANKACCTFROM><BANKID>260</BANKID><ACCTID>999</ACCTID></BANKACCTFROM>
<BANKTRANLIST>
<STMTTRN><DTPOSTED>20261010</DTPOSTED><TRNAMT>-250.50</TRNAMT><FITID>A1</FITID><NAME>Padaria &amp; Cia</NAME></STMTTRN>
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

describe("leitura de OFX", () => {
  it("lê o formato SGML em Windows-1252: acentos, vírgula decimal e fuso na data", () => {
    const list = parseOfx(Buffer.from(sgml, "latin1"));

    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({
      type: "entrada",
      amount: 1500,
      description: "PIX RECEBIDO JOÃO",
      fitId: "2026100201",
      bankId: "0341",
      accountId: "12345-6",
    });
    expect(list[0].date.toISOString()).toBe("2026-10-02T12:00:00.000Z");
    expect(list[1]).toMatchObject({ type: "saida", amount: 89.9, description: "TARIFA PACOTE SERVIÇOS" });
  });

  it("lê o formato XML em UTF-8 e usa NAME quando não há MEMO", () => {
    const list = parseOfx(Buffer.from(xml, "utf8"));

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ type: "saida", amount: 250.5, description: "Padaria & Cia" });
  });

  it("o identificador é o mesmo ao reimportar o arquivo", () => {
    const first = parseOfx(Buffer.from(sgml, "latin1")).map((t) => t.id);
    const again = parseOfx(Buffer.from(sgml, "latin1")).map((t) => t.id);

    expect(again).toEqual(first);
    expect(new Set(first).size).toBe(2);
  });

  it("sem FITID, movimentos idênticos no mesmo arquivo continuam distintos", () => {
    const twice = `<OFX><STMTTRN><DTPOSTED>20261001<TRNAMT>-10.00<MEMO>CAFE</STMTTRN><STMTTRN><DTPOSTED>20261001<TRNAMT>-10.00<MEMO>CAFE</STMTTRN></OFX>`;
    const list = parseOfx(Buffer.from(twice));

    expect(list).toHaveLength(2);
    expect(list[0].id).not.toBe(list[1].id);
  });

  it("ignora movimento com data ou valor inválido", () => {
    const bad = `<OFX><STMTTRN><DTPOSTED>20261340<TRNAMT>10.00</STMTTRN><STMTTRN><DTPOSTED>20261001<TRNAMT>abc</STMTTRN><STMTTRN><DTPOSTED>20261001<TRNAMT>5.00<MEMO>ok</STMTTRN></OFX>`;
    const list = parseOfx(Buffer.from(bad));

    expect(list).toHaveLength(1);
    expect(list[0].description).toBe("ok");
  });

  it("recusa arquivo que não é OFX", () => {
    expect(() => parseOfx(Buffer.from("isso é só um texto"))).toThrow(/não parece ser um extrato OFX/);
  });

  it("converte datas e valores nos formatos dos bancos", () => {
    expect(parseOfxDate("20260229")).toBeNull(); // 2026 não é bissexto
    expect(parseOfxAmount("1.234,56")).toBe(1234.56);
    expect(parseOfxAmount("-1,234.56")).toBe(-1234.56);
    expect(parseOfxAmount("0.1")).toBe(0.1);
  });
});

describe("rota POST /api/ofx/parse", () => {
  let office, portal;

  beforeAll(async () => {
    await resetDatabase();
    office = await createOffice("OFX");
    portal = await createPortalUser(office.company, office.client);
  });

  it("o gestor envia o extrato e recebe os movimentos", async () => {
    const res = await api()
      .post("/api/ofx/parse")
      .set(authHeaders(office.admin, office.company.id))
      .attach("file", Buffer.from(sgml, "latin1"), "extrato.ofx");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ type: "entrada", amount: 1500 });
  });

  it("sem arquivo, com arquivo que não é OFX e como cliente do portal, é recusado", async () => {
    const headers = authHeaders(office.admin, office.company.id);
    const none = await api().post("/api/ofx/parse").set(headers);
    const notOfx = await api().post("/api/ofx/parse").set(headers).attach("file", Buffer.from("texto"), "x.ofx");
    const asPortal = await api().post("/api/ofx/parse").set(authHeaders(portal)).attach("file", Buffer.from(sgml), "x.ofx");

    expect([none.status, notOfx.status, asPortal.status]).toEqual([400, 400, 403]);
  });
});
