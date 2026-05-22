import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

export const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f7fafc;
`;

export const LeftPanel = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  padding: 40px;

  @media (max-width: 900px) {
    display: none;
  }

  h1 {
    font-size: 48px;
    font-weight: 800;
    margin-bottom: 16px;
    span { color: #3182ce; }
  }

  p {
    font-size: 18px;
    color: #a0aec0;
    text-align: center;
    max-width: 400px;
    line-height: 1.6;
  }
`;

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
  max-width: 420px;
  animation: ${slideIn} 0.5s ease-out;

  h2 {
    font-size: 32px;
    color: #1a202c;
    margin-bottom: 8px;
    font-weight: 800;
  }

  p {
    color: #718096;
    margin-bottom: 32px;
    font-size: 15px;
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
    font-weight: 700;
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
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.15);
    }
  }
`;

export const Button = styled.button`
  background: #3182ce;
  color: white;
  padding: 16px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
  box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);

  &:hover:not(:disabled) {
    background: #2c5282;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(49, 130, 206, 0.3);
  }

  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

export const FooterActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  font-size: 14px;
  color: #718096;

  a {
    color: #3182ce;
    text-decoration: none;
    transition: color 0.2s;

    &:hover { color: #2c5282; text-decoration: underline; }
    &.bold { font-weight: 700; }
  }
`;