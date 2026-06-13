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
    color: ${(props) => props.theme.colors.text};
    font-weight: 800;
    margin-bottom: 8px;
  }
  p {
    color: ${(props) => props.theme.colors.textSecondary};
    font-size: 15px;
    margin: 0;
  }
`;

export const GridTop = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* 🔥 MOBILE: Cartões grandes empilhados perfeitos */
  }
`;

export const StatCard = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: 16px;
  padding: 24px;
  border: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  transition: 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    border-color: ${(props) => props.theme.colors.primaryLight};
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .title {
    color: ${(props) => props.theme.colors.textSecondary};
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
    color: ${(props) => props.theme.colors.text};
    margin-bottom: 4px;
  }
  .subtitle {
    font-size: 13px;
    color: ${(props) => props.theme.colors.textMuted};
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  @media (max-width: 768px) {
    padding: 20px; /* 🔥 MOBILE: Respiro lateral menor */
  }
`;

export const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr; /* 🔥 MOBILE/TABLET: Empilha a lista de clientes sobre a agenda */
  }
`;

export const Panel = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: 16px;
  border: 1px solid ${(props) => props.theme.colors.border};
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);

  h3 {
    font-size: 18px;
    color: ${(props) => props.theme.colors.text};
    font-weight: 800;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 2px solid ${(props) => props.theme.colors.border};
    padding-bottom: 12px;
  }

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

export const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  &:last-child {
    border-bottom: none;
  }

  .name {
    font-weight: 600;
    color: ${(props) => props.theme.colors.text};
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

  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* 🔥 MOBILE: Transforma os blocos gigantes numa lista elegante */
  }
`;

export const ActionShortcut = styled.button`
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: 0.2s;
  color: ${(props) => props.theme.colors.text};
  font-weight: 700;
  font-size: 15px;

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
    color: ${(props) => props.theme.colors.primary};
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(49, 130, 206, 0.1);
  }

  @media (max-width: 768px) {
    flex-direction: row; /* 🔥 MOBILE: Fica deitado (Ícone à esquerda, texto à direita) para poupar ecrã! */
    justify-content: flex-start;
    padding: 16px 20px;
  }
`;

export const ClientAlertBanner = styled.div`
  background: #fffaf0;
  border: 1px solid #fbd38d;
  padding: 20px 24px;
  borderradius: 16px;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  alignitems: center;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(221, 107, 32, 0.1);

  @media (max-width: 768px) {
    flex-direction: column; /* Empilha no mobile */
    align-items: stretch;
    text-align: center;
    .icon-area {
      justify-content: center;
      margin-bottom: 8px;
    }
  }
`;

export const ClientPromoPanel = styled(Panel)`
  background: linear-gradient(
    135deg,
    ${(props) => props.theme.colors.primary} 0%,
    ${(props) => props.theme.colors.primaryHover} 100%
  );
  color: white;
  border: none;
  box-shadow: 0 10px 25px rgba(49, 130, 206, 0.2);
  margin-bottom: 32px;

  .content {
    display: flex;
    align-items: center;
    gap: 16px;
    justify-content: space-between;
  }

  @media (max-width: 768px) {
    .content {
      flex-direction: column;
      text-align: center;
    }
    button {
      width: 100%;
      justify-content: center;
    }
  }
`;
