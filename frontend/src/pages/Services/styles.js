import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

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
  }
`;

export const MonthNavigator = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  button {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #4a5568;
    transition: 0.2s;
    &:hover {
      color: #3182ce;
    }
  }
`;

export const DREContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #edf2f7;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
`;

export const DRERow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #edf2f7;
  background: ${(props) => (props.$isTotal ? "#f7fafc" : "white")};
  font-weight: ${(props) => (props.$isTotal ? "800" : "500")};
  font-size: ${(props) => (props.$isTotal ? "15px" : "14px")};
  color: ${(props) => props.$color || "#2d3748"};
  padding-left: ${(props) => (props.$indent ? "48px" : "24px")};
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${(props) => (props.$isTotal ? "" : "#f7fafc")};
  }

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 8px;
    padding-left: ${(props) => (props.$indent ? "24px" : "16px")};
  }
`;
