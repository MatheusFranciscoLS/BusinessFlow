import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

// Lado Esquerdo (Branding)
export const LeftPanel = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  padding: 40px;

  @media (max-width: 768px) {
    display: none; /* Esconde em mobile */
  }

  h1 {
    font-size: 48px;
    font-weight: 800;
    margin-bottom: 16px;
    
    span {
      color: #3182ce;
    }
  }

  p {
    font-size: 18px;
    color: #a0aec0;
    text-align: center;
    max-width: 400px;
    line-height: 1.6;
  }
`;

// Lado Direito (Formulário)
export const RightPanel = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
  padding: 20px;
`;

export const FormContainer = styled.div`
  width: 100%;
  max-width: 380px;
  
  h2 {
    font-size: 28px;
    color: #1a202c;
    margin-bottom: 8px;
    font-weight: 700;
  }

  p {
    color: #718096;
    margin-bottom: 32px;
    font-size: 14px;
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
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input {
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 16px;
    transition: all 0.2s;
    background: #f7fafc;

    &:focus {
      outline: none;
      border-color: #3182ce;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
    }
  }
`;

export const Button = styled.button`
  background: #3182ce;
  color: white;
  padding: 16px;
  border-radius: 8px;
  border: none;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s;

  &:hover {
    background: #2c5282;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export const FooterActions = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  width: 100%;

  a {
    color: #4a5568;
    font-size: 14px;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #3182ce;
      text-decoration: underline;
    }

    &.bold {
      font-weight: 700;
      color: #3182ce;
    }
  }
`;