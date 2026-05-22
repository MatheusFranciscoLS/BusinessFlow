import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const Container = styled.div`
  width: 100%;
  padding-bottom: 60px;
  animation: ${fadeIn} 0.4s ease-out;
`;

export const Header = styled.header`
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 16px;

  h1 { 
    font-size: 24px; 
    color: #1a202c; 
    font-weight: 700; 
  }

  button {
    background: #3182ce; 
    color: white; 
    border: none; 
    padding: 10px 24px; 
    border-radius: 8px;
    font-weight: 600; 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);

    &:hover { 
      background: #2c5282; 
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(49, 130, 206, 0.3);
    }
  }
`;

export const DateGroup = styled.div`
  margin-bottom: 32px;
  
  h3 {
    font-size: 14px;
    text-transform: uppercase;
    color: #718096;
    font-weight: 700;
    margin-bottom: 16px;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #edf2f7;
    padding-bottom: 8px;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
`;

export const AppointmentCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border-left: 4px solid ${props => 
    props.$status === 'concluido' ? '#48bb78' : 
    props.$status === 'cancelado' ? '#f56565' : '#ecc94b'};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px rgba(0,0,0,0.08);
  }

  .info {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;

    .time {
      background: #f7fafc;
      padding: 12px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 80px;

      strong { font-size: 18px; color: #2d3748; }
      span { font-size: 11px; color: #a0aec0; text-transform: uppercase; margin-top: 4px; }
    }

    .details {
      flex: 1;
      h4 { color: #1a202c; font-size: 16px; margin-bottom: 6px; }
      p { color: #718096; font-size: 13px; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;}
      .note { color: #a0aec0; font-style: italic; font-size: 12px; margin-top: 8px; }
    }
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid #edf2f7;
    padding-top: 16px;

    button {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
      border: 1px solid transparent;

      &.check {
        background: transparent; color: #48bb78; border-color: #c6f6d5;
        &:hover { background: #c6f6d5; }
      }
      &.cancel {
        background: transparent; color: #e53e3e; border-color: #fed7d7;
        &:hover { background: #fed7d7; }
      }
      &.delete {
        color: #a0aec0; padding: 6px;
        &:hover { color: #e53e3e; background: #fff5f5; }
      }
    }

    .badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      
      &.done { background: #c6f6d5; color: #22543d; }
      &.canceled { background: #fed7d7; color: #822727; }
    }
  }
`;

export const ModalOverlay = styled.div`
  position: fixed; 
  top: 0; left: 0; right: 0; bottom: 0; 
  background: rgba(10, 15, 30, 0.6); 
  backdrop-filter: blur(4px);
  display: flex; 
  justify-content: center; 
  align-items: center; 
  z-index: 999;
`;

export const ModalContent = styled.div`
  width: 100%; 
  max-width: 500px; 
  background: white; 
  padding: 32px; 
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.3s ease-out;

  h2 { margin-bottom: 24px; color: #1a202c; }
`;

export const FormGroup = styled.div`
  margin-bottom: 16px; 
  label { 
    display: block; 
    margin-bottom: 8px; 
    color: #4a5568; 
    font-size: 14px; 
    font-weight: 600;
  }
  input, select, textarea { 
    width: 100%; 
    padding: 12px; 
    border-radius: 8px; 
    border: 1px solid #e2e8f0; 
    background: #f7fafc;
    transition: all 0.2s;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: #3182ce;
      box-shadow: 0 0 0 3px rgba(49,130,206,0.1);
      background: #fff;
    }
  }
`;

export const ModalActions = styled.div`
  display: flex; 
  justify-content: flex-end; 
  gap: 12px; 
  margin-top: 24px;
  
  button { 
    padding: 12px 24px; 
    border-radius: 8px; 
    font-weight: 600; 
    cursor: pointer; 
    transition: all 0.2s;
    
    &.cancel { 
      background: #edf2f7; color: #4a5568; border: none; 
      &:hover { background: #e2e8f0; }
    }
    &.save { 
      background: #3182ce; color: white; border: none; 
      &:hover { background: #2c5282; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(49,130,206,0.2); }
    }
  }
`;