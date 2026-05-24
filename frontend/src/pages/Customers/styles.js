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
    &.secondary {
      background: white;
      color: #4a5568;
      border: 1px solid #e2e8f0;
      &:hover {
        background: #f7fafc;
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
  background: ${(props) =>
    props.$tag === "VIP"
      ? "#ebf8ff"
      : props.$tag === "RECORRENTE"
        ? "#e6fffa"
        : props.$tag === "INADIMPLENTE"
          ? "#fff5f5"
          : "#f7fafc"};
  color: ${(props) =>
    props.$tag === "VIP"
      ? "#2b6cb0"
      : props.$tag === "RECORRENTE"
        ? "#319795"
        : props.$tag === "INADIMPLENTE"
          ? "#c53030"
          : "#4a5568"};
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

/* --- ESTILOS NOVOS DO CRM E PAGINAÇÃO --- */
export const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid #edf2f7;
  span {
    font-size: 14px;
    color: #718096;
    font-weight: 500;
  }
  div {
    display: flex;
    gap: 8px;
  }
  button {
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: white;
    color: #4a5568;
    cursor: pointer;
    transition: 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    &:hover:not(:disabled) {
      background: #edf2f7;
      color: #3182ce;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;
export const ProfileHeader = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #edf2f7;
  .avatar {
    width: 64px;
    height: 64px;
    min-width: 64px;
    border-radius: 50%;
    background: #ebf8ff;
    color: #3182ce;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .info {
    flex: 1;
    h2 {
      font-size: 20px;
      color: #1a202c;
      margin-bottom: 4px;
    }
    p {
      color: #718096;
      font-size: 14px;
    }
  }
`;
export const ProfileStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
  div {
    background: #f7fafc;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #edf2f7;
  }
  span {
    display: block;
    font-size: 13px;
    color: #718096;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  strong {
    font-size: 24px;
    color: #1a202c;
  }
  .green {
    color: #12a454;
  }
`;
export const HistoryList = styled.div`
  h3 {
    font-size: 16px;
    color: #2d3748;
    margin-bottom: 12px;
  }
  ul {
    list-style: none;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #edf2f7;
    &:last-child {
      border: none;
    }
    .desc {
      font-size: 14px;
      color: #4a5568;
      font-weight: 600;
    }
    .date {
      font-size: 12px;
      color: #a0aec0;
    }
    .val {
      font-size: 14px;
      font-weight: 800;
    }
  }
`;
