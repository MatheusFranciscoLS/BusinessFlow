import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

export const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #f7fafc; 
`;

export const SidebarContainer = styled.aside`
  width: 260px;
  background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  color: white;
  box-shadow: 4px 0 15px rgba(0,0,0,0.05);
  z-index: 10;

  @media (max-width: 768px) {
    display: none; 
  }
`;

export const Logo = styled.div`
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
  
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
  padding: 14px 16px;
  text-decoration: none;
  color: #a0aec0;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: white;
    transform: translateX(4px);
  }

  &.active {
    background-color: #3182ce;
    color: white;
    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
  }
`;

export const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: rgba(229, 62, 62, 0.1);
  color: #fc8181;
  border: 1px solid rgba(229, 62, 62, 0.2);
  padding: 14px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e53e3e;
    color: white;
  }
`;

export const MainContent = styled.main`
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;