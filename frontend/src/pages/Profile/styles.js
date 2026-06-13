import styled, { keyframes } from "styled-components";

export const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;

export const Container = styled.div`
  width: 100%;
  padding-bottom: 60px;
  animation: ${fadeIn} 0.4s ease;
`;

export const Header = styled.header`
  margin-bottom: 32px;
  h1 {
    font-size: 26px;
    color: #1a202c;
    font-weight: 800;
  }
  p {
    color: #718096;
    font-size: 14px;
    margin-top: 4px;
  }
`;

export const ProfileCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #edf2f7;
  padding: 32px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  @media (max-width: 768px) {
    padding: 20px; /* 🔥 MOBILE: Menos espaçamento lateral */
  }
`;

export const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

export const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

/* 🔥 MÁGICA 1: O nosso empilhador de formulários inteligente */
export const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.$columns || "1fr 1fr"};
  gap: ${(props) => props.$gap || "16px"};

  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* Empilha os campos um por cima do outro no mobile */
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 13px;
    font-weight: 700;
    color: #4a5568;
    text-transform: uppercase;
  }

  input {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 14px;
    outline: none;
    transition: 0.2s;
    width: 100%;
    &:focus {
      border-color: #3182ce;
    }
    &:disabled {
      background: #f7fafc;
      cursor: not-allowed;
      color: #a0aec0;
    }
  }
`;

export const ActionButton = styled.button`
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    background: #2c5282;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.2);
  }

  @media (max-width: 768px) {
    width: 100%; /* 🔥 MOBILE: Botões de gravação esticam à largura total */
  }
`;

export const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #1a202c;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const CompanyList = styled.div`
  display: grid;
  /* 🔥 MÁGICA 2: Reduzido de 320px para 280px para caber nos ecrãs mais estreitos! */
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
`;

export const CompanyItem = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  background: white;
  border-radius: 16px;
  border: 1px solid #edf2f7;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  &:hover {
    border-color: #cbd5e0;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
    transform: translateY(-2px);
  }
`;

export const AddButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 180px;
  background: #f8fafc;
  border: 2px dashed #cbd5e0;
  border-radius: 16px;
  color: #4a5568;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
  font-size: 16px;
  &:hover {
    border-color: #3182ce;
    color: #3182ce;
    background: #ebf8ff;
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
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
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e0;
    border-radius: 4px;
  }

  /* 🔥 MÁGICA 3: Reduz muito o padding interno do Modal para não esmagar conteúdo no Mobile */
  @media (max-width: 768px) {
    padding: 24px 20px !important;
  }
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  @media (max-width: 768px) {
    flex-direction: column-reverse; /* 🔥 MOBILE: Botão salvar fica em cima, cancelar em baixo */
  }
  button {
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: 0.2s;
    @media (max-width: 768px) {
      width: 100%;
    }
  }
  .cancel {
    background: #edf2f7;
    color: #4a5568;
    &:hover {
      background: #e2e8f0;
    }
  }
  .save {
    background: #3182ce;
    color: white;
    &:hover {
      background: #2c5282;
    }
  }
`;
