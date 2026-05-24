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
    background: #1a202c;
    padding: 16px;
    color: white;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    z-index: 100;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
  background: #1a202c;
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
    top: 60px;
    bottom: 0;
    height: auto; /* No mobile ele precisa seguir o bottom livremente */
    z-index: 99;
    width: 260px;
    left: ${(props) => (props.$isOpen ? "0" : "-260px")};
    box-shadow: 4px 0 15px rgba(0, 0, 0, 0.2);
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
  color: #a0aec0;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }
  &.active {
    color: white;
    background: #3182ce;
    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
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
