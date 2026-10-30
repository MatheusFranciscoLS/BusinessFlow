import styled, { css } from "styled-components";

// Peças visuais comuns do novo visual. Uma cor de ação (azul), status sempre com
// símbolo + texto (não só cor), números alinhados (tabular) e rótulos em frase normal.

export const Page = styled.div`
  width: 100%;
  max-width: 1280px;
  padding-bottom: 48px;
`;

export const PageHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px 16px;
  margin-bottom: 22px;

  .kicker { color: #64748b; font-size: 14px; }
  h1 { margin: 2px 0 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: #0f172a; }
  p { margin: 4px 0 0; color: #475569; font-size: 15px; }
`;

export const Card = styled.section`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: ${(p) => (p.$flush ? "0" : "18px 20px")};
  min-width: 0;
  overflow: ${(p) => (p.$flush ? "hidden" : "visible")};

  h2 { margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; }
`;

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: stretch;
  margin-top: 16px;
  > * { flex: 1 1 ${(p) => p.$basis || "320px"}; }
`;

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 8px;
  font: inherit;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  &:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

export const PrimaryButton = styled.button`
  ${buttonBase};
  background: #2563eb;
  color: #ffffff;
  border: 0;
  &:hover:not(:disabled) { background: #1d4ed8; }
`;

export const SecondaryButton = styled.button`
  ${buttonBase};
  background: #ffffff;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  &:hover:not(:disabled) { background: #f8fafc; }
`;

export const Money = styled.span`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

// Status das entregas: símbolo + texto, para quem não distingue cores também entender.
const STATUS = {
  ok: { bg: "#dcfce7", fg: "#166534", mark: "✓" },
  pendente: { bg: "#fef3c7", fg: "#854d0e", mark: "○" },
  atrasado: { bg: "#fee2e2", fg: "#991b1b", mark: "!" },
  aviso: { bg: "#e0e7ff", fg: "#3730a3", mark: "•" },
};

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px 3px 7px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  background: ${(p) => STATUS[p.$tone].bg};
  color: ${(p) => STATUS[p.$tone].fg};
`;

export function StatusChip({ tone = "pendente", children }) {
  return (
    <Chip $tone={tone}>
      <span aria-hidden="true">{STATUS[tone].mark}</span>
      {children}
    </Chip>
  );
}

export const Muted = styled.span`
  color: #64748b;
  font-size: ${(p) => p.$size || "14px"};
`;

export const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

export const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
