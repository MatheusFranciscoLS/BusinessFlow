import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;

export const Container = styled.div`
  width: 100%;
  padding-bottom: 40px;
  animation: ${fadeIn} 0.4s ease;
`;

export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
  h1 {
    font-size: 26px;
    color: ${(props) => props.theme.colors.text};
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

export const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.sizes.borderRadius};
  padding: 0 16px;
  flex: 1;
  min-width: 280px;
  height: 48px;
  transition: all 0.2s;
  &:focus-within {
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
  input {
    border: none;
    outline: none;
    padding: 12px;
    width: 100%;
    font-size: 14px;
    background: transparent;
    color: ${(props) => props.theme.colors.text};
  }
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: ${(props) => props.theme.sizes.borderRadius};
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: 0.2s;
  background: ${(props) => props.theme.colors.primary};
  color: white;
  box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);
  &:hover {
    background: ${(props) => props.theme.colors.primaryHover};
    transform: translateY(-2px);
  }
  @media (max-width: 768px) {
    width: 100%;
  } /* 🔥 MOBILE: Botão de Novo Cliente esticado! */
`;

export const Grid = styled.div`
  /* 🔥 MOBILE: Diminuído para 280px para nunca vazar nos iPhones menores! */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
`;

export const Card = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.colors.border};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
    border-color: #cbd5e0;
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .client-name {
    font-size: 18px;
    font-weight: 800;
    color: ${(props) => props.theme.colors.text};
    margin-bottom: 4px;
  }
  .client-doc {
    font-size: 13px;
    color: ${(props) => props.theme.colors.textSecondary};
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 1px solid ${(props) => props.theme.colors.border};
    padding-top: 16px;
  }
  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: ${(props) => props.theme.colors.text};
  }

  .card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: auto;
    border-top: 1px solid ${(props) => props.theme.colors.border};
    padding-top: 16px;
  }

  /* 🔥 MOBILE: Botões de Editar e Excluir empilham no telemóvel para não espremer! */
  @media (max-width: 768px) {
    .card-footer {
      flex-direction: column;
      button {
        width: 100%;
        justify-content: center;
      }
    }
  }
`;

export const Badge = styled.span`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  background: ${(props) =>
    props.$status === "ATIVO"
      ? props.theme.colors.successLight
      : props.$status === "INADIMPLENTE"
        ? props.theme.colors.dangerLight
        : props.theme.colors.background};
  color: ${(props) =>
    props.$status === "ATIVO"
      ? props.theme.colors.success
      : props.$status === "INADIMPLENTE"
        ? props.theme.colors.danger
        : props.theme.colors.textSecondary};
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 15, 30, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
`;

export const ModalContent = styled.div`
  background: ${(props) => props.theme.colors.surface};
  padding: 32px;
  border-radius: 16px;
  width: 100%;
  max-width: 650px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: ${fadeIn} 0.3s ease;
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e0;
    border-radius: 4px;
  }
  @media (max-width: 768px) {
    padding: 24px 20px;
  }
`;

/* 🔥 A GRELHA INTELIGENTE QUE EMPILHA NO MOBILE */
export const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.$columns || "1fr 1fr"};
  gap: 16px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  label {
    font-size: 13px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.textSecondary};
    text-transform: uppercase;
  }
  input,
  select {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.border};
    font-size: 15px;
    outline: none;
    transition: 0.2s;
    &:focus {
      border-color: ${(props) => props.theme.colors.primary};
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
    }
  }
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  button {
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: 0.2s;
  }
  .cancel {
    background: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.textSecondary};
    &:hover {
      background: ${(props) => props.theme.colors.border};
    }
  }
  .save {
    background: ${(props) => props.theme.colors.primary};
    color: white;
    &:hover {
      background: ${(props) => props.theme.colors.primaryHover};
      transform: translateY(-2px);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    button {
      width: 100%;
    }
  }
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

export const SummaryCard = styled.div`
  background: ${(props) =>
    props.$danger
      ? props.theme.colors.dangerLight
      : props.theme.colors.surface};
  border: 1px solid
    ${(props) => (props.$danger ? "#fed7d7" : props.theme.colors.border)};
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  transition: 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.05);
  }

  .icon {
    padding: 16px;
    border-radius: 12px;
    background: ${(props) =>
      props.$danger ? "#fed7d7" : props.theme.colors.primaryLight};
    color: ${(props) =>
      props.$danger ? props.theme.colors.danger : props.theme.colors.primary};
  }
  .info {
    flex: 1;
  }
  .label {
    font-size: 14px;
    color: ${(props) => props.theme.colors.textSecondary};
    font-weight: 700;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .value {
    font-size: 28px;
    font-weight: 800;
    color: ${(props) =>
      props.$danger ? props.theme.colors.danger : props.theme.colors.text};
  }
`;

export const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    ${(props) => props.theme.colors.primary} 0%,
    ${(props) => props.theme.colors.primaryHover} 100%
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(49, 130, 206, 0.3);
`;
