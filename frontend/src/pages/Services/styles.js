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
    margin-bottom: 20px;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  height: 48px;
  flex: 1;
  min-width: 280px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:focus-within {
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
  input {
    border: none;
    outline: none;
    padding: 10px;
    width: 100%;
    font-size: 14px;
    color: #4a5568;
    background: transparent;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  @media (max-width: 768px) {
    flex-direction: column;
  }

  button {
    height: 48px;
    padding: 0 20px;
    border-radius: 8px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    &.primary {
      background: #3182ce;
      color: white;
      box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);
      &:hover {
        background: #2c5282;
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(49, 130, 206, 0.3);
      }
    }
  }
`;

// --- O SEU LAYOUT DE CARDS COM PADRÃO PREMIUM ---
export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 24px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ServiceCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #edf2f7;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
`;

export const ImageContainer = styled.div`
  width: 100%;
  height: 160px;
  background: #f7fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e0;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const CardContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
  .category {
    font-size: 11px;
    font-weight: 700;
    color: #3182ce;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  h3 {
    font-size: 16px;
    color: #2d3748;
    font-weight: 700;
    margin-bottom: auto;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #edf2f7;
  .price {
    font-size: 18px;
    font-weight: 800;
    color: #12a454;
  }
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

export const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: ${(props) => props.color || "#a0aec0"};
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: ${(props) => props.$bgHover || "#edf2f7"};
    color: ${(props) => props.$hoverColor || "#1a202c"};
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #a0aec0;
  gap: 12px;
  margin-top: 40px;
  p {
    font-size: 16px;
    font-weight: 600;
    color: #4a5568;
  }
  small {
    font-size: 13px;
  }
`;

// --- MODAL ---
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
  max-width: 500px;
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: ${fadeIn} 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
  h2 {
    color: #1a202c;
    font-size: 24px;
    margin-bottom: 24px;
    font-weight: 700;
  }
  @media (max-width: 768px) {
    padding: 24px;
  }
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
    font-size: 15px;
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
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  button {
    padding: 0 24px;
    height: 48px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    flex: 1;
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
        box-shadow: 0 6px 8px rgba(49, 130, 206, 0.3);
      }
    }
  }
`;
