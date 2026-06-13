import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

export const Container = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  animation: ${fadeIn} 0.5s ease;
`;

export const LeftPanel = styled.div`
  flex: 1.2;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px;
  color: white;

  h1 {
    font-size: 42px;
    font-weight: 800;
    margin-bottom: 16px;
    letter-spacing: -1px;
    span {
      color: #60a5fa;
    }
  }
  p {
    color: #94a3b8;
    font-size: 18px;
    line-height: 1.6;
    max-width: 480px;
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

export const RightPanel = styled.div`
  flex: 1;
  background: #f7fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;

  @media (max-width: 768px) {
    padding: 20px; /* 🔥 MOBILE: Deixa a caixa respirar! */
  }
`;

export const FormContainer = styled.div`
  width: 100%;
  max-width: 400px;
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);

  h2 {
    font-size: 24px;
    color: #1a202c;
    margin-bottom: 8px;
    font-weight: 800;
  }
  p {
    color: #718096;
    font-size: 14px;
    margin-bottom: 32px;
  }

  @media (max-width: 768px) {
    padding: 32px 24px; /* 🔥 MOBILE: Diminui o espaçamento interno para os inputs terem largura! */
    max-width: 100%;
  }
`;

/* 🔥 MÁGICA 1: O Logótipo exclusivo para Telemóvel! */
export const MobileLogo = styled.h1`
  display: none;
  font-size: 32px;
  font-weight: 800;
  color: #1e3a8a;
  margin-bottom: 32px;
  text-align: center;
  letter-spacing: -1px;
  span {
    color: #3182ce;
  }

  @media (max-width: 900px) {
    display: block;
  }
`;

/* 🔥 MÁGICA 2: O Empilhador de Inputs para o Registo */
export const FormRow = styled.div`
  display: flex;
  gap: 16px;
  flex-direction: row;
  @media (max-width: 768px) {
    flex-direction: column;
  } /* Empilha no Mobile! */
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;

  label {
    font-size: 12px;
    font-weight: 800;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  input {
    width: 100%;
    height: 52px;
    padding: 0 16px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    font-size: 15px;
    font-weight: 500;
    color: #1e293b;
    background: #f8fafc;
    transition: all 0.2s;
    &:focus {
      border-color: #3182ce;
      background: white;
      outline: none;
      box-shadow: 0 4px 12px rgba(49, 130, 206, 0.1);
      transform: translateY(-1px);
    }
  }
`;

export const Button = styled.button`
  height: 48px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 12px;
  box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);
  &:hover:not(:disabled) {
    background: #2c5282;
    transform: translateY(-2px);
  }
  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

export const FooterActions = styled.div`
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #718096;
  display: flex;
  flex-direction: column;
  gap: 12px;
  a {
    color: #3182ce;
    text-decoration: none;
    font-weight: 700;
    transition: 0.2s;
    &:hover {
      color: #2c5282;
      text-decoration: underline;
    }
  }
`;
