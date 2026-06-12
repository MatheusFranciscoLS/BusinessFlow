import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

export const Container = styled.div`
  width: 100%;
  padding-bottom: 40px;
  animation: ${fadeIn} 0.4s ease;
`;
export const Header = styled.header`
  display: flex;
  flex-direction: column;
  margin-bottom: 32px;
  h1 {
    font-size: 26px;
    color: ${(props) => props.theme.colors.text};
    font-weight: 800;
    margin-bottom: 20px;
  }
`;
export const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;
export const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
`;
export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: ${(props) => props.theme.colors.surface};
  padding: 0 16px;
  border-radius: ${(props) => props.theme.sizes.borderRadius};
  border: 1px solid ${(props) => props.theme.colors.border};
  height: 48px;
  max-width: 400px;
  width: 100%;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  &:focus-within {
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
  input {
    border: none;
    outline: none;
    padding: 10px;
    width: 100%;
    font-size: 14px;
    color: ${(props) => props.theme.colors.textSecondary};
    background: transparent;
  }
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;
export const FilterPillsContainer = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  &::-webkit-scrollbar {
    display: none;
  }
`;
export const FilterPill = styled.button`
  background: ${(props) =>
    props.$active ? props.theme.colors.primary : props.theme.colors.background};
  color: ${(props) =>
    props.$active ? "white" : props.theme.colors.textSecondary};
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  &:hover {
    background: ${(props) =>
      props.$active
        ? props.theme.colors.primaryHover
        : props.theme.colors.border};
    transform: translateY(-2px);
  }
`;
export const MonthNavigator = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.sizes.borderRadius};
  height: 48px;
  padding: 0 8px;
  min-width: 200px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  span {
    font-size: 14px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.text};
    min-width: 120px;
    text-align: center;
  }
  button {
    background: transparent;
    border: none;
    color: ${(props) => props.theme.colors.textSecondary};
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    &:hover {
      background: ${(props) => props.theme.colors.background};
      color: ${(props) => props.theme.colors.primary};
    }
  }
  @media (max-width: 768px) {
    width: 100%;
  }
`;
export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
  button {
    height: 48px;
    padding: 0 20px;
    border-radius: ${(props) => props.theme.sizes.borderRadius};
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    &.primary {
      background: ${(props) => props.theme.colors.primary};
      color: white;
      box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);
      &:hover {
        background: ${(props) => props.theme.colors.primaryHover};
        transform: translateY(-2px);
      }
    }
    &.secondary {
      background: ${(props) => props.theme.colors.surface};
      color: ${(props) => props.theme.colors.textSecondary};
      border: 1px solid ${(props) => props.theme.colors.border};
      &:hover {
        background: ${(props) => props.theme.colors.background};
        border-color: #cbd5e0;
        transform: translateY(-2px);
      }
    }
  }
`;
export const SummaryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin: 32px 0;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
export const SummaryCard = styled.div`
  background: ${(props) =>
    props.$highlight ? props.theme.colors.sidebar : props.theme.colors.surface};
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 130px;
  border: 1px solid
    ${(props) => (props.$highlight ? "transparent" : props.theme.colors.border)};
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    span {
      color: ${(props) =>
        props.$highlight
          ? props.theme.colors.border
          : props.theme.colors.textSecondary};
      font-size: 15px;
      font-weight: 600;
    }
  }
  strong {
    font-size: 28px;
    font-weight: 800;
    color: ${(props) => (props.$highlight ? "white" : props.theme.colors.text)};
  }
`;

export const TableContainer = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  overflow-x: auto;
  border: 1px solid ${(props) => props.theme.colors.border};
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0 !important;
    overflow-x: hidden;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
  th,
  td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
  }
  th {
    font-weight: 600;
    color: ${(props) => props.theme.colors.textMuted};
    font-size: 12px;
    text-transform: uppercase;
    background: ${(props) => props.theme.colors.background};
    letter-spacing: 0.5px;
  }
  td {
    color: ${(props) => props.theme.colors.text};
    font-size: 14px;
  }
  tr:hover td {
    background: ${(props) => props.theme.colors.background};
  }

  /* 🔥 A MÁGICA DO NUBANK NO MOBILE: Redesenho total do Cartão usando Flex Order */
  @media (max-width: 768px) {
    min-width: 100%;
    &,
    thead,
    tbody,
    th,
    td,
    tr {
      display: block;
    }
    thead tr {
      display: none;
    }

    tr {
      display: flex !important;
      flex-direction: column;
      background: ${(props) => props.theme.colors.surface} !important;
      border: 1px solid ${(props) => props.theme.colors.border};
      border-radius: 16px;
      margin-bottom: 16px;
      padding: 20px 20px 16px 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      position: relative;
    }

    td {
      border: none !important;
      padding: 0 !important;
      width: 100%;
      display: flex;
      align-items: center;
    }

    /* Ocultamos pseudo-elementos antigos */
    td::before {
      display: none !important;
    }

    /* ORDEM E DESIGN DOS ELEMENTOS NO CARTÃO MOBILE */

    /* 1. Descrição no Topo (Damos margem direita para não bater no Status) */
    .col-desc {
      order: 1;
      padding-right: 90px;
      margin-bottom: 12px;
    }

    /* 2. Status Badge a flutuar no Topo Direito */
    .col-status {
      order: 2;
      position: absolute;
      top: 20px;
      right: 20px;
      width: auto;
    }

    /* 3. Nome do Cliente (Pequeno e discreto) */
    .col-client {
      order: 3;
      margin-bottom: 4px;
      opacity: 0.8;
    }

    /* 4. Valor (Grande Destaque no Meio) */
    .col-value {
      order: 4;
      margin-bottom: 12px;
      font-size: 24px;
      font-weight: 800;
    }

    /* 5. Categoria e 6. Data (Um ao lado do outro ou empilhados pequenos) */
    .col-category {
      order: 5;
      margin-bottom: 4px;
    }
    .col-date {
      order: 6;
      margin-bottom: 16px;
      font-size: 13px;
      color: ${(props) => props.theme.colors.textSecondary};
    }

    /* 7. Barra de Ações e Checkbox no Rodapé do Cartão */
    .col-actions {
      order: 7;
      border-top: 1px solid ${(props) => props.theme.colors.border};
      padding-top: 16px;
      justify-content: flex-end;
    }
    .col-checkbox {
      order: 8;
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: auto;
    }
  }
`;

export const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: ${(props) => props.color || props.theme.colors.textMuted};
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${(props) =>
      props.color ? `${props.color}15` : props.theme.colors.background};
    transform: scale(1.1);
  }
`;
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 15, 30, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 16px;
`;

export const ModalContent = styled.div`
  width: 100%;
  max-width: 650px;
  background: ${(props) => props.theme.colors.surface};
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: ${fadeIn} 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
  h2 {
    color: ${(props) => props.theme.colors.text};
    font-size: 24px;
    margin-bottom: 24px;
    font-weight: 700;
  }

  /* 🔥 CORREÇÃO DA FOTO 3: Ajuste de padding para não espremer no Mobile */
  @media (max-width: 768px) {
    padding: 24px 20px;
  }
`;

/* 🔥 A NOVA GRELHA PARA O FORMULÁRIO (Substitui os styles inline que estavam a espremer os inputs) */
export const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.$columns || "1fr 1fr"};
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* Empilha tudo num ecrã pequeno! */
  }
`;

export const FormGroup = styled.div`
  margin-bottom: 16px;
  label {
    font-size: 13px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.textSecondary};
    margin-bottom: 8px;
    display: block;
  }
  input,
  select {
    width: 100%;
    padding: 0 16px;
    height: 48px;
    border-radius: ${(props) => props.theme.sizes.borderRadius};
    border: 1px solid ${(props) => props.theme.colors.border};
    font-size: 15px;
    transition: all 0.2s;
    &:focus {
      border-color: ${(props) => props.theme.colors.primary};
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
      outline: none;
    }
  }
`;
export const TransactionTypeContainer = styled.div`
  margin: 20px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;
export const RadioBox = styled.button`
  height: 56px;
  border: 2px solid
    ${(props) =>
      props.$isActive
        ? props.$activeColor === "green"
          ? props.theme.colors.success
          : props.theme.colors.danger
        : props.theme.colors.border};
  border-radius: ${(props) => props.theme.sizes.borderRadius};
  background: ${(props) =>
    props.$isActive
      ? props.$activeColor === "green"
        ? props.theme.colors.successLight
        : props.theme.colors.dangerLight
      : "transparent"};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
  span {
    font-size: 15px;
    font-weight: 600;
    color: ${(props) =>
      props.$isActive
        ? props.theme.colors.text
        : props.theme.colors.textSecondary};
  }
  &:hover {
    transform: translateY(-2px);
  }
`;
export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  button {
    padding: 0 24px;
    height: 48px;
    border-radius: ${(props) => props.theme.sizes.borderRadius};
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    flex: 1;
    &.cancel {
      background: ${(props) => props.theme.colors.background};
      color: ${(props) => props.theme.colors.textSecondary};
      &:hover {
        background: ${(props) => props.theme.colors.border};
      }
    }
    &.save {
      background: ${(props) => props.theme.colors.primary};
      color: white;
      &:hover {
        background: ${(props) => props.theme.colors.primaryHover};
        transform: translateY(-2px);
      }
    }
  }
`;
