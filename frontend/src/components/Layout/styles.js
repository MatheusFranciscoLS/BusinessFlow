import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

export const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #f7f9fc; /* Fundo claro da área de conteúdo */
`;

export const SidebarContainer = styled.aside`
  width: 260px;
  background-color: #1a202c; /* Cor escura "Slate" */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  color: white;
  box-shadow: 4px 0 10px rgba(0,0,0,0.1);

  @media (max-width: 768px) {
    display: none; /* Em mobile seria um menu hambúrguer (podemos ver depois) */
  }
`;

export const Logo = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  span {
    color: #3182ce; /* Destaque azul */
  }
`;

export const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// Estilizando o Link do React Router
export const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  text-decoration: none;
  color: #a0aec0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: white;
  }

  /* Classe automática do React Router quando o link está ativo */
  &.active {
    background-color: #3182ce;
    color: white;
    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
  }
`;

export const LogoutButton = styled.button`
  background: transparent;
  border: 1px solid #4a5568;
  color: #cbd5e0;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s;
  margin-top: auto; /* Empurra para o final */

  &:hover {
    background: rgba(229, 62, 62, 0.1);
    border-color: #e53e3e;
    color: #e53e3e;
  }
`;

export const MainContent = styled.main`
  flex: 1;
  padding: 32px;
  overflow-y: auto; /* Permite scroll apenas no conteúdo, sidebar fixa */
`;