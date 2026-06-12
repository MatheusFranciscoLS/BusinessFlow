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
    color: #1a202c;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: 0.2s;
  background: #3182ce;
  color: white;
  box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);
  &:hover {
    background: #2c5282;
    transform: translateY(-2px);
  }
`;

export const Layout = styled.div`
  display: flex;
  gap: 24px;
  height: 70vh;
  min-height: 600px;
  @media (max-width: 1024px) {
    flex-direction: column;
    height: auto;
  }
`;

export const Sidebar = styled.div`
  width: 380px;
  background: white;
  border-radius: 16px;
  border: 1px solid #edf2f7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  @media (max-width: 1024px) {
    width: 100%;
    height: 400px;
  }
`;

export const TicketCard = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #edf2f7;
  cursor: pointer;
  transition: 0.2s;
  background: ${(props) => (props.$active ? "#ebf8ff" : "white")};
  border-left: 4px solid
    ${(props) => (props.$active ? "#3182ce" : "transparent")};
  &:hover {
    background: #f7fafc;
  }
`;

export const Badge = styled.span`
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  background: ${(props) =>
    props.$status === "ABERTO"
      ? "#fed7d7"
      : props.$status === "EM_ANDAMENTO"
        ? "#fefcbf"
        : "#c6f6d5"};
  color: ${(props) =>
    props.$status === "ABERTO"
      ? "#c53030"
      : props.$status === "EM_ANDAMENTO"
        ? "#b7791f"
        : "#22543d"};
`;

export const ChatArea = styled.div`
  flex: 1;
  background: #efeae2
    url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png");
  background-size: contain;
  border-radius: 16px;
  border: 1px solid #edf2f7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
`;

export const MessageBubble = styled.div`
  max-width: 65%;
  padding: 8px 12px 22px 12px;
  position: relative;
  font-size: 14.5px;
  line-height: 1.4;
  align-self: ${(props) => (props.$isMine ? "flex-end" : "flex-start")};
  background: ${(props) => (props.$isMine ? "#d9fdd3" : "white")};
  color: #111b21;
  border-radius: 12px;
  border-top-right-radius: ${(props) => (props.$isMine ? "0" : "12px")};
  border-top-left-radius: ${(props) => (props.$isMine ? "12px" : "0")};
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    max-width: 85%; /* Balões respiram mais no mobile */
  }

  .meta {
    position: absolute;
    bottom: 4px;
    right: 8px;
    font-size: 11px;
    color: #667781;
    display: flex;
    align-items: center;
    gap: 4px;
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
  background: white;
  padding: 32px;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* 🔥 NO MOBILE: Menos margens para não espremer os inputs */
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
    color: #4a5568;
    text-transform: uppercase;
  }
  input,
  select,
  textarea {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 14px;
    outline: none;
    transition: 0.2s;
    &:focus {
      border-color: #3182ce;
    }
  }
`;

/* 🔥 MÁGICA 1: O Empilhador de Colunas (Usado no Modal) */
export const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.$columns || "1fr 1fr"};
  gap: 16px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* Empilha no mobile! */
  }
`;

/* 🔥 MÁGICA 2: O Cabeçalho do Chat Responsivo */
export const ChatHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #edf2f7;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .chat-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chat-meta {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: #718096;
    flex-wrap: wrap; /* Impede que corte a tela em ecrãs pequenos */
  }
`;

/* 🔥 MÁGICA 3: O Teclado do Chat Responsivo */
export const ChatInputArea = styled.div`
  padding: 12px 20px;
  background: #f0f2f5;
  display: flex;
  gap: 16px;
  align-items: center;

  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-direction: column; /* Empilha o select de status e a caixa de texto */
    align-items: stretch; /* Estica para ocupar a largura toda */
    gap: 12px;
  }

  .chat-form {
    display: flex;
    gap: 12px;
    flex: 1;
    align-items: center;
  }
`;
