import styled, { keyframes } from "styled-components";

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); } 
  to { opacity: 1; transform: translateY(0); }
`;

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

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
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
  } /* 🔥 MOBILE: Botão gigante e confortável */
`;

/* 🔥 MÁGICA 1: Contentor de Filtros Inteligente */
export const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  > * {
    flex: 1;
    min-width: 260px;
  }

  .select-wrapper {
    display: flex;
    align-items: center;
    background: ${(props) => props.theme.colors.surface};
    padding: 0 16px;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.border};
  }
`;

export const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  padding: 0 16px;
  height: 48px;
  transition: 0.2s;
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

export const SelectFilter = styled.select`
  height: 48px;
  padding: 0 8px;
  border: none;
  outline: none;
  background: transparent;
  color: ${(props) => props.theme.colors.textSecondary};
  font-weight: 600;
  cursor: pointer;
  width: 100%;
`;

export const DocsGrid = styled.div`
  /* 🔥 MÁGICA 2: Largura mínima ajustada para 280px para caber no iPhone SE! */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`;

export const DocCard = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.colors.border};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: 0.2s;
  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
    border-color: #cbd5e0;
    transform: translateY(-2px);
  }

  /* 🔥 MÁGICA 3: O rodapé do documento que não quebra no telemóvel! */
  .card-footer {
    border-top: 1px solid ${(props) => props.theme.colors.border};
    padding-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .footer-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
    color: ${(props) => props.theme.colors.textSecondary};
  }
  .footer-actions {
    display: flex;
    gap: 8px;
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(2px);
`;

export const ModalContent = styled.div`
  background: ${(props) => props.theme.colors.surface};
  padding: 32px;
  border-radius: 16px;
  width: 100%;
  max-width: 550px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
  @media (max-width: 768px) {
    padding: 24px 20px;
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
    font-size: 14px;
    outline: none;
    transition: 0.2s;
    &:focus {
      border-color: ${(props) => props.theme.colors.primary};
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
