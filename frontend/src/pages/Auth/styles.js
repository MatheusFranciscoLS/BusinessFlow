import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

export const Container = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  animation: ${fadeIn} 0.5s ease;
`;

export const LeftPanel = styled.div`
  flex: 1;
  background: #1a202c;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
  color: white;
  h1 {
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 16px;
    span {
      color: #3182ce;
    }
  }
  p {
    color: #a0aec0;
    font-size: 16px;
    line-height: 1.6;
  }

  @media (max-width: 900px) {
    display: none; /* Esconde o painel decorativo no mobile para focar no formulário */
  }
`;

export const RightPanel = styled.div`
  flex: 1;
  background: #f7fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  @media (max-width: 500px) {
    padding: 16px;
  }
`;

export const FormContainer = styled.div`
  width: 100%;
  max-width: 400px;
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 8px;
  }
  p {
    color: #718096;
    font-size: 14px;
    margin-bottom: 32px;
    strong {
      color: #2d3748;
    }
  }

  @media (max-width: 500px) {
    padding: 24px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  }
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
  label {
    font-size: 13px;
    font-weight: 600;
    color: #4a5568;
  }
  input {
    width: 100%;
    height: 48px;
    padding: 0 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 16px;
    transition: all 0.2s;
    &:focus {
      border-color: #3182ce;
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
      outline: none;
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
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 12px;
  box-shadow: 0 4px 6px rgba(49, 130, 206, 0.15);

  &:hover {
    background: #2c5282;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(49, 130, 206, 0.2);
  }
  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const FooterActions = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #718096;

  div {
    display: flex;
    gap: 6px;
  }
  a {
    color: #3182ce;
    text-decoration: none;
    transition: 0.2s;
    &:hover {
      text-decoration: underline;
      color: #2c5282;
    }
    &.bold {
      font-weight: 700;
    }
  }
`;
