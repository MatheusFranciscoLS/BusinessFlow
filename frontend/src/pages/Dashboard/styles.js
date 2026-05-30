import styled, { keyframes } from "styled-components";

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const Container = styled.div`
  width: 100%;
  padding-bottom: 40px;
  animation: ${fadeIn} 0.5s ease;
`;

export const Header = styled.header`
  margin-bottom: 32px;
  h1 {
    font-size: 28px;
    color: #1a202c;
    font-weight: 800;
    margin-bottom: 8px;
  }
  p {
    color: #718096;
    font-size: 15px;
    margin: 0;
  }
`;

export const GridTop = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

export const StatCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #edf2f7;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  transition: 0.2s;
  cursor: pointer; /* 🔥 A MÁGICA DO UX COMEÇA AQUI */

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    border-color: #cbd5e0; /* Dá um leve destaque na borda ao passar o rato */
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .title {
    color: #718096;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .value {
    font-size: 32px;
    font-weight: 800;
    color: #2d3748;
    margin-bottom: 4px;
  }

  .subtitle {
    font-size: 13px;
    color: #a0aec0;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

export const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const Panel = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #edf2f7;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);

  h3 {
    font-size: 18px;
    color: #2d3748;
    font-weight: 800;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 2px solid #edf2f7;
    padding-bottom: 12px;
  }
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #edf2f7;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;

  div {
    height: 100%;
    background: ${(props) => props.$color};
    border-radius: 4px;
    transition: width 1s ease-in-out;
  }
`;

export const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #edf2f7;

  &:last-child {
    border-bottom: none;
  }

  .name {
    font-weight: 600;
    color: #4a5568;
    font-size: 14px;
  }

  .status {
    font-size: 12px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 12px;
  }
`;

export const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

export const ActionShortcut = styled.button`
  background: white;
  border: 1px solid #e2e8f0;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: 0.2s;
  color: #4a5568;
  font-weight: 700;
  font-size: 15px;

  &:hover {
    border-color: #3182ce;
    color: #3182ce;
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(49, 130, 206, 0.1);
  }
`;
