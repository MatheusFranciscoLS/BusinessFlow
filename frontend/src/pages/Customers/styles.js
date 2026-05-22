import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

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
  animation: ${fadeIn} 0.4s ease;
`;

export const Header = styled.header`
  margin-bottom: 32px;
  h1 { font-size: 24px; color: #1a202c; font-weight: 700; margin-bottom: 16px; }
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
  max-width: 400px;
  transition: all 0.2s;

  &:focus-within {
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }

  input {
    border: none;
    outline: none;
    margin-left: 12px;
    width: 100%;
    font-size: 14px;
    color: #4a5568;
    background: transparent;
  }
  @media (max-width: 768px) { max-width: 100%; }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  
  button {
    height: 48px;
    padding: 0 20px;
    border-radius: 8px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    border: none;
    transition: all 0.2s;

    &.primary { 
      background: #3182ce; color: white; 
      &:hover { background: #2c5282; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(49,130,206,0.2); }
    }
    &.secondary { 
      background: white; color: #4a5568; border: 1px solid #e2e8f0; 
      &:hover { background: #f7fafc; border-color: #cbd5e0; }
    }
  }
`;

export const EmptyState = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 20px; color: #a0aec0; text-align: center;
  
  p { font-size: 18px; color: #4a5568; font-weight: 600; margin: 16px 0 8px; }
  small { font-size: 14px; }
`;

export const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  overflow-x: auto;

  &::-webkit-scrollbar { height: 8px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;

  th, td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #edf2f7; }
  th { font-weight: 600; color: #a0aec0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; }
  td { color: #4a5568; font-size: 14px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f7fafc; }
`;

export const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${props => getTagColor(props.$tag).bg};
  color: ${props => getTagColor(props.$tag).color};
  letter-spacing: 0.5px;
`;

export const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.color || '#a0aec0'};
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover { background: #edf2f7; transform: scale(1.1); }
`;

export const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
  background: rgba(10, 15, 30, 0.6); backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center; z-index: 999;
`;

export const ModalContent = styled.div`
  width: 100%; max-width: 600px; background: white; padding: 32px;
  border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); 
  max-height: 90vh; overflow-y: auto;
  animation: ${fadeIn} 0.3s ease;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
  
  h2 { color: #1a202c; font-size: 24px; margin-bottom: 24px; font-weight: 700; }
`;

export const FormGroup = styled.div`
  margin-bottom: 16px;
  label { font-size: 13px; font-weight: 600; color: #4a5568; margin-bottom: 8px; display: block; }
  input, select { 
    width: 100%; padding: 0 16px; height: 48px; border-radius: 8px; 
    border: 1px solid #e2e8f0; background: #fff; font-size: 15px; transition: all 0.2s;
    &:focus { border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49,130,206,0.1); outline: none; }
    &[readonly] { background: #f7fafc; color: #a0aec0; cursor: not-allowed; } 
  }
`;

export const ModalActions = styled.div`
  display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;
  button { 
    padding: 0 24px; height: 48px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    &.cancel { background: #edf2f7; color: #4a5568; border: none; &:hover { background: #e2e8f0; } }
    &.save { background: #3182ce; color: white; border: none; &:hover { background: #2c5282; } }
  }
`;