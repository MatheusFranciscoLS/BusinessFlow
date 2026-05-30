import styled, { keyframes } from "styled-components";

export const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;

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

export const SelectFilter = styled.select`
  height: 48px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  outline: none;
  background: white;
  color: #4a5568;
  font-weight: 600;
  cursor: pointer;
`;

export const DocsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

export const DocCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #edf2f7;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: 0.2s;
  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
    border-color: #cbd5e0;
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
  max-width: 550px;
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
  }
`;
