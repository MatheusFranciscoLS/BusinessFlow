import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

export const Container = styled.div`
  width: 100%;
  padding-bottom: 40px;
  animation: ${fadeIn} 0.4s ease;
`;

export const Header = styled.header`
  display: flex;
  flex-direction: column;
  margin-bottom: 32px;
  h1 {
    font-size: 26px;
    color: #1a202c;
    font-weight: 800;
    margin-bottom: 20px;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  height: 48px;
  flex: 1;
  min-width: 280px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:focus-within {
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
  input {
    border: none;
    outline: none;
    padding: 10px;
    width: 100%;
    font-size: 14px;
    color: #4a5568;
    background: transparent;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  @media (max-width: 768px) {
    flex-direction: column;
  }

  button {
    height: 48px;
    padding: 0 20px;
    border-radius: 8px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    &.primary {
      background: #3182ce;
      color: white;
      box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);
      &:hover {
        background: #2c5282;
        transform: translateY(-2px);
      }
    }
  }
`;

export const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  overflow-x: auto;
  border: 1px solid #edf2f7;
  margin-top: 24px;
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  th,
  td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid #edf2f7;
  }
  th {
    font-weight: 600;
    color: #a0aec0;
    font-size: 12px;
    text-transform: uppercase;
    background: #f8fafc;
    letter-spacing: 0.5px;
  }
  td {
    color: #4a5568;
    font-size: 14px;
  }
  tr:hover td {
    background: #f7fafc;
  }
`;

export const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: ${(props) => props.color || "#a0aec0"};
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${(props) => (props.color ? `${props.color}15` : "#edf2f7")};
    transform: scale(1.1);
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 15, 30, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 16px;
`;

export const ModalContent = styled.div`
  width: 100%;
  max-width: 450px;
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: ${fadeIn} 0.3s ease;
  h2 {
    color: #1a202c;
    font-size: 22px;
    margin-bottom: 24px;
    font-weight: 700;
  }
`;

export const FormGroup = styled.div`
  margin-bottom: 16px;
  label {
    font-size: 13px;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 8px;
    display: block;
  }
  input,
  select,
  textarea {
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 14px;
    transition: all 0.2s;
    &:focus {
      border-color: #3182ce;
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
      outline: none;
    }
  }
`;

export const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  button {
    flex: 1;
    height: 48px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    &.cancel {
      background: #edf2f7;
      color: #4a5568;
      &:hover {
        background: #e2e8f0;
      }
    }
    &.save {
      background: #3182ce;
      color: white;
      &:hover {
        background: #2c5282;
        transform: translateY(-2px);
      }
    }
  }
`;
