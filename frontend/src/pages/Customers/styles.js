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
    color: #1a202c;
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
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 16px;
  flex: 1;
  min-width: 280px;
  height: 48px;

  input {
    border: none;
    outline: none;
    padding: 12px;
    width: 100%;
    font-size: 14px;
    background: transparent;
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

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
`;

export const Card = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #edf2f7;
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
    color: #2d3748;
    margin-bottom: 4px;
  }

  .client-doc {
    font-size: 13px;
    color: #718096;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 1px solid #edf2f7;
    padding-top: 16px;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #4a5568;
  }

  .card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: auto;
    border-top: 1px solid #edf2f7;
    padding-top: 16px;
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
      ? "#C6F6D5"
      : props.$status === "INADIMPLENTE"
        ? "#FED7D7"
        : "#EDF2F7"};
  color: ${(props) =>
    props.$status === "ATIVO"
      ? "#22543D"
      : props.$status === "INADIMPLENTE"
        ? "#9B2C2C"
        : "#4A5568"};
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
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
  select {
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
  }

  .cancel {
    background: #edf2f7;
    color: #4a5568;
  }
  .save {
    background: #3182ce;
    color: white;
  }
`;
