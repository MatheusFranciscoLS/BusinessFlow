import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

export const Container = styled.div`
  width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.4s ease;
`;

export const Header = styled.header`
  margin-bottom: 32px;
  h1 { font-size: 26px; color: #1a202c; font-weight: 800; margin-bottom: 16px; }
`;

export const Toolbar = styled.div`
  display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;
  @media (max-width: 768px) { flex-direction: column; align-items: stretch; }
`;

export const SearchContainer = styled.div`
  display: flex; align-items: center; background: white; padding: 0 16px; border-radius: 8px;
  border: 1px solid #e2e8f0; height: 48px; flex: 1; max-width: 400px; transition: all 0.2s;
  &:focus-within { border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1); }
  input { border: none; outline: none; margin-left: 12px; width: 100%; font-size: 14px; color: #4a5568; background: transparent; }
  @media (max-width: 768px) { max-width: 100%; }
`;

export const NewButton = styled.button`
  background: #3182ce; color: white; border: none; padding: 0 24px; height: 48px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s;
  &:hover { background: #2c5282; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(49,130,206,0.2); }
`;

export const GridContainer = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; margin-top: 24px;
`;

export const ServiceCard = styled.div`
  background: white; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); overflow: hidden; display: flex; flex-direction: column; border: 1px solid #edf2f7; transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-6px); box-shadow: 0 12px 20px rgba(0,0,0,0.08); }
`;

export const ImageContainer = styled.div`
  height: 160px; background: #f7fafc; display: flex; justify-content: center; align-items: center; color: #cbd5e0; overflow: hidden; border-bottom: 1px solid #edf2f7;
  img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
  ${ServiceCard}:hover img { transform: scale(1.05); }
`;

export const CardContent = styled.div`
  padding: 20px; display: flex; flex-direction: column; flex-grow: 1;
  .category { font-size: 11px; font-weight: 700; color: #3182ce; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
  h3 { font-size: 16px; color: #1a202c; font-weight: 700; margin-bottom: 20px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
`;

export const CardFooter = styled.div`
  margin-top: auto; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #edf2f7; padding-top: 16px;
  .price { font-size: 18px; font-weight: 800; color: #2d3748; }
`;

export const Actions = styled.div`
  display: flex; gap: 8px;
`;

export const ActionButton = styled.button`
  background: transparent; border: none; padding: 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;
  color: ${props => props.color};
  &:hover { background: ${props => props.$bgHover}; color: ${props => props.$hoverColor}; transform: scale(1.05); }
`;

export const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 15, 30, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 999; 
`;

export const ModalContent = styled.div`
  width: 100%; max-width: 500px; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); animation: ${fadeIn} 0.3s ease;
  h2 { color: #1a202c; margin-bottom: 24px; font-size: 24px; font-weight: 700; }
`;

export const FormGroup = styled.div`
  margin-bottom: 20px;
  label { display: block; margin-bottom: 8px; color: #4a5568; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
  input, select { width: 100%; padding: 0 16px; height: 48px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; font-size: 15px; transition: all 0.2s; &:focus { border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49,130,206,0.1); outline: none; } }
`;

export const ModalActions = styled.div`
  display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;
  button { padding: 0 24px; height: 48px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none;
    &.cancel { background: #edf2f7; color: #4a5568; &:hover { background: #e2e8f0; } }
    &.save { background: #3182ce; color: white; &:hover { background: #2c5282; transform: translateY(-2px); } }
  }
`;