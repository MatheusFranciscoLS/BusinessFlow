import styled from "styled-components";
import { NavLink } from "react-router-dom";

export const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f7fafc;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const MobileHeader = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #0f172a; /* 🔥 Ajustado para o novo tom escuro */
    padding: 16px;
    color: white;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    z-index: 100;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
`;

export const HamburgerButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

export const Overlay = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 98;
  }
`;

export const SidebarContainer = styled.aside`
  width: 260px;
  /* 🔥 A MÁGICA VISUAL: O Gradiente Premium que liga tudo! */
  background: linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%);
  padding: 32px 24px;
  display: flex;
  flex-direction: column;

  /* 🔥 A MÁGICA DO SCROLL TRAVADO AQUI 🔥 */
  position: sticky;
  top: 0;
  height: 100vh;
  /* ------------------------------------- */

  justify-content: space-between;
  color: white;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: ${(props) => (props.$isOpen ? "0" : "-100%")};
    z-index: 1000;

    height: 100dvh; /* Usa a altura exata da tela visível do celular */
    overflow-y: auto; /* Permite rolar o menu se a tela for pequena */
    padding-bottom: 24px; /* Dá um respiro no final para o botão não colar na borda */

    /* Esconde a barra de rolagem visualmente para ficar mais elegante */
    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export const MainContent = styled.main`
  flex: 1;
  padding: 40px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  @media (max-width: 768px) {
    padding: 24px;
    margin-top: 60px;
  }
`;

export const Logo = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: white;
  margin-bottom: 48px;
  span {
    color: #3182ce;
  }
`;

export const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #94a3b8; /* 🔥 Tom mais moderno de cinza azulado */
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.08); /* Efeito Hover suave */
  }
  &.active {
    color: white;
    /* 🔥 Design Apple-like: Barra lateral e gradiente suave */
    background: linear-gradient(
      90deg,
      rgba(49, 130, 206, 0.4) 0%,
      rgba(49, 130, 206, 0) 100%
    );
    border-left: 4px solid #60a5fa;
    border-radius: 0 8px 8px 0;
  }
`;

export const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: none;
  color: #fb8282;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  text-align: left;
  transition: all 0.2s;

  &:hover {
    background: rgba(251, 130, 130, 0.1);
  }
`;

// 🔥 NOVO ESTILO DO SELETOR DE EMPRESAS
export const CompanySelector = styled.select`
  width: 100%;
  /* 🔥 Efeito Glassmorphism (Vidro) */
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;

  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 12px top 50%;
  background-size: 10px auto;

  &:focus {
    border-color: #60a5fa;
    background: rgba(255, 255, 255, 0.1);
  }

  option {
    background: #0f172a; /* Garante que o menu suspenso seja escuro */
    color: white;
  }
`;