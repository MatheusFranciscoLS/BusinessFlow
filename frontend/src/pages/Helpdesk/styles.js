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
  background: white;
  border-radius: 16px;
  border: 1px solid #edf2f7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
`;

export const MessageBubble = styled.div`
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
  font-size: 14px;
  line-height: 1.5;
  align-self: ${(props) => (props.$isMine ? "flex-end" : "flex-start")};
  background: ${(props) => (props.$isMine ? "#3182ce" : "#edf2f7")};
  color: ${(props) => (props.$isMine ? "white" : "#2d3748")};
  border-bottom-right-radius: ${(props) => (props.$isMine ? "4px" : "12px")};
  border-bottom-left-radius: ${(props) => (props.$isMine ? "12px" : "4px")};
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
