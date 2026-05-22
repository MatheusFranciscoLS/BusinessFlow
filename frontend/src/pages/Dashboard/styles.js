import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;

export const Container = styled.div`
  width: 100%;
  animation: ${fadeIn} 0.4s ease-out;
`;

export const Header = styled.header`
  margin-bottom: 32px;
  h1 { font-size: 26px; color: #1a202c; font-weight: 800; }
  p { color: #718096; margin-top: 6px; font-size: 15px; }
`;

export const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

export const Card = styled.div`
  background: ${props => props.$highlight ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' : 'white'};
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 150px;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.$highlight ? 'transparent' : '#edf2f7'};

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    
    span {
      color: ${props => props.$highlight ? '#e2e8f0' : '#718096'};
      font-size: 15px;
      font-weight: 600;
    }
  }

  strong {
    font-size: 32px;
    font-weight: 800;
    color: ${props => props.$highlight ? 'white' : '#2d3748'};
    line-height: 1;
  }
`;

export const ChartContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border: 1px solid #edf2f7;

  h3 {
    font-size: 16px;
    color: #2d3748;
    margin-bottom: 24px;
    font-weight: 700;
  }
  
  @media (max-width: 1024px) {
    grid-column: span 2;
  }
`;