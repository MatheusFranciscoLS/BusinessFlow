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
    color: #1e293b;
    margin-bottom: 8px;
    display: flex;
    alignitems: center;
    gap: 8px;
  }
  p {
    color: #64748b;
    font-size: 15px;
  }
`;

export const LogTable = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

export const LogRow = styled.div`
  display: grid;
  grid-template-columns: 180px 150px 120px 1fr;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  transition: background 0.2s;

  &:hover {
    background: #f8fafc;
  }
  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
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

  ${(props) =>
    props.$action === "CREATE" && "background: #dcfce7; color: #166534;"}
  ${(props) =>
    props.$action === "UPDATE" && "background: #fef9c3; color: #854d0e;"}
  ${(props) =>
    props.$action === "DELETE" && "background: #fee2e2; color: #991b1b;"}
  ${(props) =>
    props.$action === "DOWNLOAD" && "background: #e0e7ff; color: #3730a3;"}
`;

export const TextCol = styled.div`
  font-size: 14px;
  color: #334155;

  strong {
    color: #0f172a;
    display: block;
    margin-bottom: 2px;
  }
  span {
    color: #64748b;
    font-size: 12px;
  }
`;
