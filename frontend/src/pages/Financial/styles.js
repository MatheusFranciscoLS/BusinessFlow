import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

export const Container = styled.div`
  width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.4s ease;
`;

export const Header = styled.header`
  display: flex; flex-direction: column; margin-bottom: 32px;
  h1 { font-size: 26px; color: #1a202c; font-weight: 800; margin-bottom: 20px; }
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

export const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
`;

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  height: 48px;
  max-width: 400px;
  width: 100%;
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

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

export const FilterPillsContainer = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const FilterPill = styled.button`
  background: ${(props) => (props.$active ? "#3182ce" : "#edf2f7")};
  color: ${(props) => (props.$active ? "white" : "#4a5568")};
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: ${(props) => (props.$active ? "#2c5282" : "#e2e8f0")};
    transform: translateY(-2px);
  }
`;

/* O NOVO SELETOR DE MÊS ESTILO FINTECH */
export const MonthNavigator = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  height: 48px;
  padding: 0 8px;
  min-width: 200px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  span {
    font-size: 14px;
    font-weight: 700;
    color: #2d3748;
    min-width: 120px;
    text-align: center;
  }

  button {
    background: transparent;
    border: none;
    color: #718096;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: #f7fafc;
      color: #3182ce;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
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
    &.secondary {
      background: white;
      color: #4a5568;
      border: 1px solid #e2e8f0;
      &:hover {
        background: #f7fafc;
        border-color: #cbd5e0;
        transform: translateY(-2px);
      }
    }
  }
`;

export const SummaryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin: 32px 0;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled.div`
  background: ${(props) => (props.$highlight ? "#1a202c" : "white")};
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 130px;
  border: 1px solid ${(props) => (props.$highlight ? "transparent" : "#edf2f7")};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    span {
      color: ${(props) => (props.$highlight ? "#e2e8f0" : "#718096")};
      font-size: 15px;
      font-weight: 600;
    }
  }
  strong {
    font-size: 28px;
    font-weight: 800;
    color: ${(props) => (props.$highlight ? "white" : "#2d3748")};
  }
`;

export const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  overflow-x: auto;
  border: 1px solid #edf2f7;
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
  min-width: 700px;
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
  max-width: 500px;
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: ${fadeIn} 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
  h2 {
    color: #1a202c;
    font-size: 24px;
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
  select {
    width: 100%;
    padding: 0 16px;
    height: 48px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 15px;
    transition: all 0.2s;
    &:focus {
      border-color: #3182ce;
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
      outline: none;
    }
  }
`;

export const TransactionTypeContainer = styled.div`
  margin: 20px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

export const RadioBox = styled.button`
  height: 56px;
  border: 2px solid
    ${(props) =>
      props.$isActive
        ? props.$activeColor === "green"
          ? "#48bb78"
          : "#f56565"
        : "#e2e8f0"};
  border-radius: 8px;
  background: ${(props) =>
    props.$isActive
      ? props.$activeColor === "green"
        ? "#f0fff4"
        : "#fff5f5"
      : "transparent"};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
  span {
    font-size: 15px;
    font-weight: 600;
    color: ${(props) => (props.$isActive ? "#1a202c" : "#718096")};
  }
  &:hover {
    transform: translateY(-2px);
  }
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  button {
    padding: 0 24px;
    height: 48px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    flex: 1;
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