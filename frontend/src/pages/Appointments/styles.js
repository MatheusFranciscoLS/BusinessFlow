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

  button {
    height: 48px;
    padding: 0 20px;
    border-radius: 8px;
    background: #3182ce;
    color: white;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);
    &:hover {
      background: #2c5282;
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(49, 130, 206, 0.3);
    }
  }
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    button {
      justify-content: center;
    }
  }
`;

export const SummaryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 110px;
  border: 1px solid #edf2f7;
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
      color: #718096;
      font-size: 14px;
      font-weight: 600;
    }
  }
  strong {
    font-size: 26px;
    font-weight: 800;
    color: #2d3748;
  }
`;

export const DateGroup = styled.div`
  margin-bottom: 32px;
  h3 {
    font-size: 13px;
    text-transform: uppercase;
    color: #a0aec0;
    letter-spacing: 1px;
    margin-bottom: 16px;
    border-bottom: 1px solid #edf2f7;
    padding-bottom: 8px;
    font-weight: 700;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const AppointmentCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid
    ${(props) =>
      props.$status === "concluido"
        ? "#48bb78"
        : props.$status === "cancelado"
          ? "#f56565"
          : "#3182ce"};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }

  .info {
    display: flex;
    gap: 16px;
    .time {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 65px;
      height: 60px;
      background: #f7fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      strong {
        color: #2d3748;
        font-size: 16px;
        font-weight: 700;
      }
      span {
        color: #a0aec0;
        font-size: 10px;
        text-transform: uppercase;
        font-weight: 700;
        margin-top: 2px;
      }
    }
    .details {
      flex: 1;
      h4 {
        font-size: 15px;
        color: #2d3748;
        font-weight: 700;
        margin-bottom: 4px;
      }
      p {
        font-size: 13px;
        color: #718096;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 2px;
      }
      .note {
        font-style: italic;
        font-size: 12px;
        margin-top: 6px;
        color: #a0aec0;
        background: #f7fafc;
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid #edf2f7;
      }
    }
  }

  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #edf2f7;
    padding-top: 12px;
    margin-top: auto;

    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      &.done {
        background: #e6fffa;
        color: #319795;
      }
      &.canceled {
        background: #fff5f5;
        color: #c53030;
      }
    }

    .buttons-group {
      display: flex;
      gap: 4px;
    }

    button {
      background: transparent;
      border: none;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      color: #718096;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      &:hover {
        background: #f7fafc;
        color: #2d3748;
      }
      &.check {
        color: #48bb78;
        &:hover {
          background: #f0fff4;
        }
      }
      &.cancel {
        color: #f56565;
        &:hover {
          background: #fff5f5;
        }
      }
      &.delete {
        color: #cbd5e0;
        padding: 6px;
        &:hover {
          color: #e53e3e;
          background: #fff5f5;
        }
      }
    }
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 15, 30, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 16px;
`;

export const ModalContent = styled.div`
  width: 100%;
  max-width: 450px;
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: ${fadeIn} 0.3s ease;
  h2 {
    color: #1a202c;
    font-size: 22px;
    margin-bottom: 24px;
    font-weight: 700;
  }
  @media (max-width: 500px) {
    padding: 24px;
  }
  animate: ${fadeIn} 0.3s ease;
`;

export const FormGroup = styled.div`
  margin-bottom: 16px;
  label {
    font-size: 13px;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 8px;
    display: block;
  }
  input,
  select,
  textarea {
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 14px;
    transition: all 0.2s;
    &:focus {
      border-color: #3182ce;
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
      outline: none;
    }
  }
`;

export const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  button {
    flex: 1;
    height: 48px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    &.cancel {
      background: #edf2f7;
      color: #4a5568;
      &:hover {
        background: #e2e8f0;
      }
    }
    &.save {
      background: #3182ce;
      color: white;
      box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);
      &:hover {
        background: #2c5282;
        transform: translateY(-2px);
      }
    }
  }
`;
