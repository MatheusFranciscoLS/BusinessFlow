import styled from "styled-components";

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const Header = styled.div`
  margin-bottom: 32px;
  h1 {
    font-size: 24px;
    color: ${(props) => props.theme.colors.sidebar};
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  p {
    color: ${(props) => props.theme.colors.textSecondary};
    font-size: 15px;
  }
`;

export const LogTable = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.sizes.borderRadius};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  /* 🔥 NO MOBILE, O FUNDO SOME PARA OS CARTÕES RESPIRAREM */
  @media (max-width: 768px) {
    background: transparent;
    box-shadow: none;
  }
`;

/* 🔥 ESCONDE O CABEÇALHO NO TELEMÓVEL */
export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 180px 150px 120px 1fr;
  gap: 16px;
  padding: 16px 24px;
  background: #f8fafc;
  font-weight: bold;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 12px;
  text-transform: uppercase;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};

  @media (max-width: 768px) {
    display: none;
  }
`;

export const LogRow = styled.div`
  display: grid;
  grid-template-columns: 180px 150px 120px 1fr;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  align-items: center;
  transition: background 0.2s;

  &:hover {
    background: #f8fafc;
  }
  &:last-child {
    border-bottom: none;
  }

  /* 🔥 A MÁGICA: TRANSFORMA LINHA EM CARTÃO NO MOBILE */
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    background: ${(props) => props.theme.colors.surface};
    margin-bottom: 16px;
    border-radius: ${(props) => props.theme.sizes.borderRadius};
    border: 1px solid ${(props) => props.theme.colors.border};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    padding: 20px;

    &:hover {
      background: ${(props) => props.theme.colors.surface};
    }
  }
`;

export const Badge = styled.span`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  display: inline-block;
  text-align: center;

  /* Usa as cores do nosso Design System! */
  ${(props) =>
    props.$action === "CREATE" &&
    `background: ${props.theme.colors.successLight}; color: ${props.theme.colors.success};`}
  ${(props) =>
    props.$action === "UPDATE" &&
    `background: ${props.theme.colors.warningLight}; color: ${props.theme.colors.warning};`}
  ${(props) =>
    props.$action === "DELETE" &&
    `background: ${props.theme.colors.dangerLight}; color: ${props.theme.colors.danger};`}
  ${(props) =>
    props.$action === "DOWNLOAD" &&
    `background: ${props.theme.colors.primaryLight}; color: ${props.theme.colors.primary};`}
`;

export const TextCol = styled.div`
  font-size: 14px;
  color: ${(props) => props.theme.colors.text};

  strong {
    color: ${(props) => props.theme.colors.sidebar};
    display: block;
    margin-bottom: 2px;
  }
  span {
    color: ${(props) => props.theme.colors.textSecondary};
    font-size: 12px;
  }
`;
