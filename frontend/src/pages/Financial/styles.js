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
  display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;
  @media (max-width: 768px) { flex-direction: column; align-items: stretch; }
`;

export const FilterGroup = styled.div`
  display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
`;

export const SearchContainer = styled.div`
  display: flex; align-items: center; background: white; padding: 0 16px; border-radius: 8px;
  border: 1px solid #e2e8f0; height: 48px; flex: 1; min-width: 250px; transition: all 0.2s;

  &:focus-within { border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1); }
  input, select { border: none; outline: none; padding: 10px; width: 100%; font-size: 14px; color: #4a5568; background: transparent; }
`;

export const ButtonGroup = styled.div`
  display: flex; gap: 12px;
  button {
    height: 48px; padding: 0 20px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; border: none;
    &.primary { background: #3182ce; color: white; &:hover { background: #2c5282; transform: translateY(-2px); } }
    &.secondary { background: white; color: #4a5568; border: 1px solid #e2e8f0; &:hover { background: #f7fafc; border-color: #cbd5e0; } }
  }
`;

export const SummaryContainer = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin: 32px 0;
`;

export const SummaryCard = styled.div`
  background: ${props => props.$highlight ? '#1a202c' : 'white'};
  padding: 24px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; justify-content: space-between; height: 130px; border: 1px solid ${props => props.$highlight ? 'transparent' : '#edf2f7'};
  header { display: flex; justify-content: space-between; align-items: center; span { color: ${props => props.$highlight ? '#e2e8f0' : '#718096'}; font-size: 15px; font-weight: 600; } }
  strong { font-size: 28px; font-weight: 800; color: ${props => props.$highlight ? 'white' : '#2d3748'}; }
`;

export const TableContainer = styled.div`
  background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); overflow-x: auto;
  &::-webkit-scrollbar { height: 8px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
`;

export const Table = styled.table`
  width: 100%; border-collapse: collapse; min-width: 600px;
  th, td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #edf2f7; }
  th { font-weight: 600; color: #a0aec0; font-size: 12px; text-transform: uppercase; background: #f8fafc; }
  td { color: #4a5568; font-size: 14px; }
  tr:hover td { background: #f7fafc; }
`;

export const ActionButton = styled.button`
  background: transparent; border: none; color: ${props => props.color || '#a0aec0'}; padding: 8px; border-radius: 6px; cursor: pointer; transition: all 0.2s;
  &:hover { background: #edf2f7; transform: scale(1.1); }
`;

export const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 15, 30, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 999;
`;

export const ModalContent = styled.div`
  width: 100%; max-width: 500px; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: ${fadeIn} 0.3s ease;
  h2 { color: #1a202c; font-size: 24px; margin-bottom: 24px; font-weight: 700; }
`;

export const FormGroup = styled.div`
  margin-bottom: 16px;
  label { font-size: 13px; font-weight: 600; color: #4a5568; margin-bottom: 8px; display: block; }
  input, select { width: 100%; padding: 0 16px; height: 48px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 15px; transition: all 0.2s; &:focus { border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49,130,206,0.1); outline: none; } }
`;

export const TransactionTypeContainer = styled.div`
  margin: 20px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
`;

export const RadioBox = styled.button`
  height: 56px; border: 2px solid ${props => props.$isActive ? (props.$activeColor === 'green' ? '#48bb78' : '#f56565') : '#e2e8f0'};
  border-radius: 8px; background: ${props => props.$isActive ? (props.$activeColor === 'green' ? '#f0fff4' : '#fff5f5') : 'transparent'};
  display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 0.2s; outline: none;
  span { font-size: 15px; font-weight: 600; color: ${props => props.$isActive ? '#1a202c' : '#718096'}; }
`;

export const ModalActions = styled.div`
  display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;
  button { padding: 0 24px; height: 48px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none;
    &.cancel { background: #edf2f7; color: #4a5568; &:hover { background: #e2e8f0; } }
    &.save { background: #3182ce; color: white; &:hover { background: #2c5282; transform: translateY(-2px); } }
  }
`;