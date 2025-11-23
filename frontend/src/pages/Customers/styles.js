import styled from 'styled-components';

// Função para cores das Tags
const getTagColor = (tag) => {
  switch (tag) {
    case 'VIP': return { bg: '#E9D8FD', color: '#44337A' };
    case 'NOVO': return { bg: '#BEE3F8', color: '#2C5282' };
    case 'RECORRENTE': return { bg: '#C6F6D5', color: '#22543D' };
    case 'INADIMPLENTE': return { bg: '#FED7D7', color: '#822727' };
    default: return { bg: '#E2E8F0', color: '#4A5568' };
  }
};

export const Container = styled.div`
  width: 100%;
  padding-bottom: 40px;
`;

export const Header = styled.header`
  margin-bottom: 32px;

  h1 {
    font-size: 24px;
    color: #1a202c;
    font-weight: 700;
    margin-bottom: 16px;
  }
`;

// Nova barra de ferramentas para Busca e Botões
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
  flex: 1;
  max-width: 400px;
  height: 48px;

  input {
    border: none;
    outline: none;
    padding: 10px;
    width: 100%;
    font-size: 14px;
    color: #4a5568;
    
    &::placeholder {
      color: #a0aec0;
    }
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;

  button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 20px;
    height: 48px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: filter 0.2s;

    &.primary {
      background: #3182ce;
      color: white;
      &:hover { filter: brightness(0.9); }
    }

    &.secondary {
      background: white;
      color: #3182ce;
      border: 1px solid #3182ce;
      &:hover { background: #ebf8ff; }
    }
  }
`;

export const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  margin-top: 24px;
`;

export const Table = styled.table`
  width: 100%;
  border-spacing: 0;

  th {
    background: #f7fafc;
    color: #969cb3;
    font-weight: 500;
    padding: 20px 32px;
    text-align: left;
    font-size: 14px;
    border-bottom: 1px solid #e2e8f0;
  }

  td {
    padding: 20px 32px;
    border: 0;
    background: white;
    font-size: 14px;
    color: #4a5568;
    border-bottom: 1px solid #eee;

    strong { color: #2d3748; }
  }

  tr:last-child td { border-bottom: none; }
`;

export const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  background-color: ${props => getTagColor(props.$tag).bg};
  color: ${props => getTagColor(props.$tag).color};
`;

export const ActionButton = styled.button`
  background: transparent !important;
  border: none;
  padding: 8px !important;
  margin-left: 4px;
  cursor: pointer;
  color: ${props => props.color || '#718096'} !important;
  &:hover { opacity: 0.7; background: rgba(0,0,0,0.05) !important; }
`;

/* --- MODAL --- */
export const ModalOverlay = styled.div`
  position: fixed; top: 0; bottom: 0; right: 0; left: 0;
  background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 999;
`;
export const ModalContent = styled.div`
  width: 100%; max-width: 600px; background: white; padding: 40px;
  border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;
  h2 { color: #363f5f; font-size: 24px; margin-bottom: 24px; }
`;
export const FormGroup = styled.div`
  margin-bottom: 16px;
  label { font-size: 14px; color: #969cb3; margin-bottom: 8px; display: block; }
  input, select { width: 100%; padding: 0 16px; height: 48px; border-radius: 5px; border: 1px solid #d7d7d7; background: #e7e9ee; font-size: 16px; &:focus { border-color: #3182ce; outline: none; } &[readonly] { background: #f7fafc; color: #a0aec0; cursor: not-allowed; } }
`;
export const ModalActions = styled.div`
  display: flex; justify-content: flex-end; gap: 10px; margin-top: 32px;
  button { width: auto; padding: 0 32px; height: 56px; border-radius: 5px; border: 0; font-size: 16px; font-weight: 600; cursor: pointer; 
  &.cancel { background: #e7e9ee; color: #363f5f; &:hover { filter: brightness(0.9); } }
  &.save { background: #3182ce; color: white; &:hover { filter: brightness(0.9); } } }
`;

// Estilo para o Empty State
export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #A0AEC0;
  
  p {
    font-size: 18px;
    margin-top: 16px;
    font-weight: 500;
  }
  
  small {
    font-size: 14px;
    margin-top: 4px;
  }
`;