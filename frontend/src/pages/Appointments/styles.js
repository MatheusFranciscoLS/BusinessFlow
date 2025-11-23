import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  padding-bottom: 60px;
`;

export const Header = styled.header`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;
  h1 { font-size: 24px; color: #1a202c; font-weight: 700; }
  button {
    background: #3182ce; color: white; border: none; padding: 10px 24px; border-radius: 8px;
    font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #2c5282; }
  }
`;

// Agrupador de Data (Ex: "Hoje, 22 de Nov")
export const DateGroup = styled.div`
  margin-bottom: 32px;
  
  h3 {
    font-size: 14px;
    text-transform: uppercase;
    color: #718096;
    font-weight: 700;
    margin-bottom: 16px;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
  }
`;

export const Grid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const AppointmentCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  /* Barra lateral colorida baseada no status */
  &::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background-color: ${props => props.$status === 'concluido' ? '#48bb78' : props.$status === 'cancelado' ? '#e53e3e' : '#ecc94b'};
  }

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  /* Coluna da Esquerda: Horário e Cliente */
  .info {
    display: flex;
    align-items: center;
    gap: 24px;

    .time {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
      
      strong { font-size: 18px; color: #2d3748; }
      span { font-size: 12px; color: #a0aec0; text-transform: uppercase; }
    }

    .details {
      h4 { font-size: 16px; color: #2d3748; margin-bottom: 4px; }
      p { font-size: 13px; color: #718096; display: flex; align-items: center; gap: 6px; }
      .note { font-style: italic; color: #a0aec0; font-size: 12px; margin-top: 4px; }
    }
  }

  /* Coluna da Direita: Ações */
  .actions {
    display: flex;
    gap: 12px;
    
    button {
      background: transparent;
      border: 1px solid transparent;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;

      &.check {
        color: #22543d;
        background: #f0fff4;
        border-color: #c6f6d5;
        &:hover { background: #c6f6d5; }
      }

      &.cancel {
        color: #822727;
        background: #fff5f5;
        border-color: #fed7d7;
        &:hover { background: #fed7d7; }
      }
      
      &.delete {
        color: #718096;
        &:hover { color: #e53e3e; background: #fff5f5; }
      }
    }
    
    /* Badge de Concluído (estático) */
    .badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      
      &.done { background: #c6f6d5; color: #22543d; }
      &.canceled { background: #fed7d7; color: #822727; }
    }
  }
`;

// MODAL (Pode manter os mesmos estilos de antes ou copiar do Customers)
export const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 999;`;
export const ModalContent = styled.div`width: 100%; max-width: 500px; background: white; padding: 32px; border-radius: 12px;`;
export const FormGroup = styled.div`margin-bottom: 16px; label { display: block; margin-bottom: 8px; color: #4a5568; font-size: 14px; } input, select, textarea { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 15px; } textarea{resize:vertical}`;
export const ModalActions = styled.div`display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; button { padding: 12px 24px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; &.cancel { background: #e2e8f0; } &.save { background: #3182ce; color: white; } }`;