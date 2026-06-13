import styled, { keyframes } from "styled-components";

export const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;

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

export const ActionGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    width: 100%;
  } /* 🔥 MOBILE: Estica os botões de ação na largura total */
`;

export const Button = styled.button`
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  @media (max-width: 768px) {
    flex: 1;
  } /* 🔥 MOBILE: Os botões dividem o ecrã de forma igual */
`;

export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  } /* 🔥 MOBILE: Ficam 2 por linha em vez de 1 gigante */
`;

export const StatCard = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: 12px;
  padding: 24px;
  border: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: ${(props) => props.theme.colors.textSecondary};
    font-size: 14px;
    font-weight: 600;
  }
  .value {
    font-size: 28px;
    font-weight: 800;
    color: ${(props) => props.$color || props.theme.colors.text};
  }
  @media (max-width: 768px) {
    padding: 16px;
    .title {
      font-size: 12px;
      flex-direction: column-reverse;
      align-items: flex-start;
      gap: 8px;
    }
    .value {
      font-size: 24px;
    }
  }
`;

export const TabsContainer = styled.div`
  display: flex;
  gap: 32px;
  border-bottom: 2px solid ${(props) => props.theme.colors.border};
  margin-bottom: 24px;
  overflow-x: auto;
  &::-webkit-scrollbar {
    display: none;
  } /* Esconde a barra visualmente mas permite arrastar */
`;

export const TabButton = styled.button`
  background: none;
  border: none;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 800;
  color: ${(props) =>
    props.$active ? props.theme.colors.primary : props.theme.colors.textMuted};
  border-bottom: 3px solid
    ${(props) => (props.$active ? props.theme.colors.primary : "transparent")};
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  &:hover {
    color: ${(props) =>
      props.$active
        ? props.theme.colors.primaryHover
        : props.theme.colors.textSecondary};
  }
`;

export const KanbanBoard = styled.div`
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 16px;
  min-height: 45vh;
  align-items: flex-start;
  animation: ${fadeIn} 0.3s ease;
  scroll-snap-type: x mandatory; /* 🔥 MOBILE UX: Faz as colunas encaixarem quando o ecrã roda! */
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 8px;
  }
`;

export const Column = styled.div`
  flex: 1;
  min-width: 320px;
  max-width: 400px;
  background: ${(props) => props.theme.colors.background};
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  scroll-snap-align: start; /* 🔥 MOBILE UX: Ponto de encaixe da coluna */
  @media (max-width: 768px) {
    min-width: 85vw;
  } /* 🔥 MOBILE: Deixa o utilizador ver um pouco da próxima coluna para saber que pode arrastar! */
`;

export const ColumnHeader = styled.div`
  padding: 16px;
  font-weight: 800;
  font-size: 15px;
  color: ${(props) => props.$color};
  border-bottom: 2px solid ${(props) => props.$color}30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${(props) => props.$bg};
  border-radius: 12px 12px 0 0;
`;

export const Card = styled.div`
  background: ${(props) => props.theme.colors.surface};
  margin: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.colors.border};
  cursor: ${(props) => (props.$isClient ? "default" : "grab")};
  transition: 0.2s;
  border-left: 4px solid ${(props) => props.$priorityColor};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  &:hover {
    box-shadow: ${(props) =>
      props.$isClient ? "none" : "0 4px 12px rgba(0,0,0,0.08)"};
    transform: ${(props) => (props.$isClient ? "none" : "translateY(-2px)")};
  }
  &:active {
    cursor: grabbing;
  }
`;

export const RadarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(280px, 1fr)
  ); /* 🔥 CORRIGIDO: De 320px para 280px! */
  gap: 20px;
  animation: ${fadeIn} 0.3s ease;
`;

export const RadarCard = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.colors.border};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: 0.2s;
  border-top: 4px solid
    ${(props) =>
      props.$isIncome ? props.theme.colors.success : props.theme.colors.danger};
  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
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
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
  @media (max-width: 768px) {
    padding: 24px 20px;
  } /* 🔥 MOBILE: Margens perfeitas */
`;

/* 🔥 MÁGICA: O EMPILHADOR DE FORMULÁRIOS */
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
  select,
  textarea {
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
