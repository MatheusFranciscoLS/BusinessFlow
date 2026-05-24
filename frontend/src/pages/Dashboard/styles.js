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
    margin-bottom: 8px;
  }
  p {
    color: #718096;
    font-size: 14px;
  }
`;

export const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.div`
  background: ${(props) => (props.$highlight ? "#3182ce" : "white")};
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

export const ChartLayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  } /* Gráficos empilham em tablets/mobile */
`;

export const ChartContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #edf2f7;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  }
  h3 {
    font-size: 16px;
    color: #1a202c;
    font-weight: 700;
    margin-bottom: 20px;
  }
`;

export const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  /* Quando for tablet/mobile, muda para 1 coluna empilhada! */
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const BottomRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;
