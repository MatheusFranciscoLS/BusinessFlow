import styled, { keyframes } from "styled-components";

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); } 
  to { opacity: 1; transform: translateY(0); }
`;

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

export const ActionGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

export const Button = styled.button`
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

export const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #edf2f7;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #718096;
    font-size: 14px;
    font-weight: 600;
  }
  .value {
    font-size: 28px;
    font-weight: 800;
    color: ${(props) => props.$color || "#2d3748"};
  }
`;

export const TabsContainer = styled.div`
  display: flex;
  gap: 32px;
  border-bottom: 2px solid #edf2f7;
  margin-bottom: 24px;
  overflow-x: auto;
`;

export const TabButton = styled.button`
  background: none;
  border: none;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 800;
  color: ${(props) => (props.$active ? "#3182ce" : "#a0aec0")};
  border-bottom: 3px solid
    ${(props) => (props.$active ? "#3182ce" : "transparent")};
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  &:hover {
    color: ${(props) => (props.$active ? "#3182ce" : "#718096")};
  }
`;

export const KanbanBoard = styled.div`
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 16px;
  min-height: 45vh;
  align-items: flex-start;
  animation: ${fadeIn} 0.3s ease;
`;

export const Column = styled.div`
  flex: 1;
  min-width: 300px;
  background: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
`;

export const ColumnHeader = styled.div`
  padding: 16px;
  font-weight: 800;
  font-size: 15px;
  color: ${(props) => props.$color};
  border-bottom: 2px solid ${(props) => props.$color}30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${(props) => props.$bg};
  border-radius: 12px 12px 0 0;
`;

export const Card = styled.div`
  background: white;
  margin: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  cursor: ${(props) => (props.$isClient ? "default" : "grab")};
  transition: 0.2s;
  border-left: 4px solid ${(props) => props.$priorityColor};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  &:hover {
    box-shadow: ${(props) =>
      props.$isClient ? "none" : "0 4px 12px rgba(0,0,0,0.08)"};
    transform: ${(props) => (props.$isClient ? "none" : "translateY(-2px)")};
  }
  &:active {
    cursor: grabbing;
  }
`;

export const RadarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  animation: ${fadeIn} 0.3s ease;
`;

export const RadarCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #edf2f7;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: 0.2s;
  border-top: 4px solid ${(props) => (props.$isIncome ? "#48bb78" : "#e53e3e")};
  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }
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
  max-width: 500px;
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
  select,
  textarea {
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
