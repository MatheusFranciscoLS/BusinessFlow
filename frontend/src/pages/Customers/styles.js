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
        box-shadow: 0 6px 8px rgba(49, 130, 206, 0.3);
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
  min-width: 750px;
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
    strong {
      color: #2d3748;
    }
  }
  tr:hover td {
    background: #f8fafc;
  }
`;

export const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) => {
    if (props.$tag === "VIP") return "#ebf8ff";
    if (props.$tag === "RECORRENTE") return "#e6fffa";
    if (props.$tag === "INADIMPLENTE") return "#fff5f5";
    return "#f7fafc";
  }};
  color: ${(props) => {
    if (props.$tag === "VIP") return "#2b6cb0";
    if (props.$tag === "RECORRENTE") return "#319795";
    if (props.$tag === "INADIMPLENTE") return "#c53030";
    return "#4a5568";
  }};
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
  max-width: 600px;
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
  h3 {
    font-size: 14px;
    color: #718096;
    margin: 20px 0 10px;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }
  @media (max-width: 768px) {
    padding: 24px;
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
      box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);
      &:hover {
        background: #2c5282;
        transform: translateY(-2px);
      }
    }
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #a0aec0;
  gap: 12px;
  p {
    font-size: 16px;
    font-weight: 600;
    color: #4a5568;
  }
  small {
    font-size: 13px;
  }
`;
