import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  padding-bottom: 40px;
`;

export const Header = styled.header`
  margin-bottom: 32px;
  h1 {
    font-size: 24px;
    color: #1a202c;
    font-weight: 700;
    margin-bottom: 16px;
  }
`;

// --- ADICIONADOS QUE FALTAVAM ---
export const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

export const NewButton = styled.button`
  background: #3182ce;
  color: white;
  border: none;
  padding: 0 24px;
  height: 48px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2c5282;
  }
`;

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  flex: 1;
  max-width: 400px;
  height: 48px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);

  input {
    border: none;
    outline: none;
    padding: 10px;
    width: 100%;
    font-size: 14px;
    color: #4a5568;

    &::placeholder {
      color: #a0aec0;
    }
  }
`;

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
  margin-top: 24px;
`;

// --- ESTILOS DO NOVO CARD ---

export const ServiceCard = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #edf2f7;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
`;

export const ImageContainer = styled.div`
  width: 100%;
  height: 180px;
  background-color: #f7fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    opacity: 0.3;
    color: #a0aec0;
  }
`;

export const CardContent = styled.div`
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;

  .category {
    font-size: 11px;
    font-weight: 700;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 16px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

export const CardFooter = styled.div`
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  .price {
    font-size: 22px;
    font-weight: 800;
    color: #3182ce;
  }
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

export const ActionButton = styled.button`
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: ${props => props.color || '#a0aec0'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.$bgHover || '#edf2f7'};
    color: ${props => props.$hoverColor || props.color};
    transform: scale(1.05);
  }
`;

// --- MODAL ---
export const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 999; backdrop-filter: blur(2px);`;
export const ModalContent = styled.div`width: 100%; max-width: 500px; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); h2 { color: #1a202c; margin-bottom: 32px; font-size: 24px; }`;
export const FormGroup = styled.div`margin-bottom: 24px; label { display: block; margin-bottom: 8px; color: #4a5568; font-weight: 500; font-size: 14px; } input, select { width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 15px; transition: border-color 0.2s; &:focus { border-color: #3182ce; outline: none; } }`;
export const ModalActions = styled.div`display: flex; justify-content: flex-end; gap: 16px; margin-top: 40px; button { padding: 12px 24px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; font-size: 15px; transition: all 0.2s; &.cancel { background: #e2e8f0; color: #4a5568; &:hover { background: #cbd5e0; } } &.save { background: #3182ce; color: white; &:hover { background: #2c5282; } } }`;