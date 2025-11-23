import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
`;

export const Header = styled.header`
  margin-bottom: 32px;
  
  h1 {
    font-size: 24px;
    color: #1a202c;
    font-weight: 700;
  }
  
  p {
    color: #718096;
    margin-top: 4px;
  }
`;

export const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

export const Card = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 140px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    span {
      color: #718096;
      font-size: 14px;
      font-weight: 600;
    }
    
    svg {
      color: #3182ce;
      opacity: 0.8;
    }
  }

  strong {
    font-size: 28px;
    color: #1a202c;
    font-weight: 700;
  }
  
  small {
    font-size: 12px;
    color: #48bb78; /* Verde para indicar crescimento */
    font-weight: 600;
  }
`;

export const ChartContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  height: 400px; /* Altura fixa para o gráfico renderizar bem */

  h3 {
    margin-bottom: 24px;
    color: #1a202c;
    font-size: 18px;
  }
`;