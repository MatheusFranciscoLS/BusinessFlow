import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  padding-bottom: 40px;
`;

export const Header = styled.header`
  display: flex;
  flex-direction: column;
  margin-bottom: 32px;

  h1 {
    font-size: 24px;
    color: #1a202c;
    font-weight: 700;
    margin-bottom: 16px;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

export const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  height: 48px;

  input, select {
    border: none;
    outline: none;
    padding: 10px;
    width: 100%;
    font-size: 14px;
    color: #4a5568;
    background: transparent;
    -webkit-appearance: none;
    -moz-appearance: none;    
    appearance: none;
    background-color: white; 
    padding-right: 25px; 
    cursor: pointer;
  }
  
  select {
    min-width: 120px;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  
  button {
    background: white;
    color: #3182ce;
    border: 1px solid #3182ce;
    padding: 0 20px;
    height: 48px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s;
    
    &.primary {
      background: #3182ce;
      color: white;
      &:hover { filter: brightness(0.9); }
    }
    &.secondary {
      &:hover { background: #ebf8ff; }
    }
  }
`;

// --- CARDS ---
export const SummaryContainer = styled.section`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-bottom: 32px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled.div`
  background: ${props => props.$highlight ? '#3182ce' : 'white'};
  padding: 24px 32px;
  border-radius: 8px;
  color: ${props => props.$highlight ? 'white' : '#1a202c'};
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0;
    
    span {
      font-size: 16px;
      opacity: ${props => props.$highlight ? 0.9 : 0.7};
    }
  }

  strong {
    display: block;
    margin-top: 16px;
    font-size: 32px;
    font-weight: 500;
    line-height: 48px;
  }
`;

// --- TABELA E BADGES ---

// Função para cores das Categorias (USADA NO CATEGORY BADGE)
const getCategoryColor = (cat) => {
  const category = cat ? cat.toLowerCase() : '';
  if (category.includes('venda')) return { bg: '#C6F6D5', color: '#22543D' }; // Verde
  if (category.includes('serviço')) return { bg: '#BEE3F8', color: '#2C5282' }; // Azul
  if (category.includes('fixo')) return { bg: '#E2E8F0', color: '#4A5568' }; // Cinza
  if (category.includes('infra')) return { bg: '#E9D8FD', color: '#44337A' }; // Roxo
  if (category.includes('pessoal')) return { bg: '#FED7D7', color: '#822727' }; // Vermelho Claro
  if (category.includes('variavel')) return { bg: '#FEEBC8', color: '#7B341E' }; // Laranja
  return { bg: '#EDF2F7', color: '#2D3748' }; // Padrão
};

// Badge Colorida para a Categoria
export const CategoryBadge = styled.span`
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  display: inline-block;
  
  background-color: ${props => getCategoryColor(props.$category).bg};
  color: ${props => getCategoryColor(props.$category).color};
`;

export const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
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
  }

  tbody tr {
    transition: background 0.2s;
    &:hover {
      background: #f7fafc;
    }
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

export const ActionButton = styled.button`
  background: transparent !important;
  border: none;
  padding: 8px !important;
  margin-left: 4px;
  cursor: pointer;
  color: ${props => props.color || '#718096'} !important;
  &:hover {
    opacity: 0.7;
    background: rgba(0,0,0,0.05) !important;
  }
`;

// --- MODAL ---
export const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 999;`;
export const ModalContent = styled.div`width: 100%; max-width: 576px; background: white; padding: 48px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); h2 { color: #363f5f; font-size: 24px; margin-bottom: 32px; }`;
export const FormGroup = styled.div`margin-bottom: 20px; label { font-size: 14px; color: #969cb3; margin-bottom: 8px; display: block; } input, select { width: 100%; padding: 0 24px; height: 56px; border-radius: 5px; border: 1px solid #d7d7d7; background: #e7e9ee; font-size: 16px; &:focus { border-color: #3182ce; outline: none; } }`;
export const TransactionTypeContainer = styled.div`margin: 16px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;`;
export const RadioBox = styled.button`height: 64px; border: 1px solid #d7d7d7; border-radius: 5px; background: ${props => props.$isActive ? (props.$activeColor === 'green' ? 'rgba(18, 164, 84, 0.1)' : 'rgba(229, 46, 77, 0.1)') : 'transparent'}; display: flex; align-items: center; justify-content: center; cursor: pointer; &:hover { border-color: #aaa; } span { margin-left: 16px; font-size: 16px; color: #363f5f; }`;
export const ModalActions = styled.div`display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; button { width: 100%; padding: 0 24px; height: 64px; border-radius: 5px; border: 0; font-size: 16px; margin-top: 24px; font-weight: 600; cursor: pointer; &.cancel { background: #e7e9ee; color: #363f5f; } &.save { background: #33cc95; color: #fff; } }`;