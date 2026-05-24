import React, { useState } from 'react';
import { Outlet } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { LayoutDashboard, Users, DollarSign, LogOut, Briefcase, Calendar, Menu, X } from 'lucide-react';
import { 
  Container, SidebarContainer, MainContent, Logo, NavMenu, 
  StyledNavLink, LogoutButton, MobileHeader, HamburgerButton, Overlay 
} from './styles';

export default function Layout() {
  const { signOut, user } = useAuth(); 
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <Container>
      {/* Cabeçalho superior fixo - Visível apenas no Mobile */}
      <MobileHeader>
        <Logo style={{ fontSize: 20, margin: 0 }}>
          Business<span>Flow</span>
        </Logo>
        <HamburgerButton onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </HamburgerButton>
      </MobileHeader>

      {/* Sombra de fundo ao abrir o menu no mobile */}
      {isOpen && <Overlay onClick={closeMenu} />}

      {/* Sidebar ativa com propriedade de controle mobile */}
      <SidebarContainer $isOpen={isOpen}>
        <div>
          <Logo>
            Business<span>Flow</span>
          </Logo>
          
          <div style={{ marginBottom: 40, color: '#a0aec0', fontSize: 13, fontWeight: 500 }}>
            Olá, <strong style={{ color: 'white' }}>{user?.name || 'Gestor'}</strong>
          </div>

          <NavMenu>
            <StyledNavLink to="/app" end onClick={closeMenu}> 
              <LayoutDashboard size={20} /> Dashboard
            </StyledNavLink>

            <StyledNavLink to="/app/clientes" onClick={closeMenu}>
              <Users size={20} /> Clientes
            </StyledNavLink>

            <StyledNavLink to="/app/servicos" onClick={closeMenu}>
              <Briefcase size={20} /> Serviços
            </StyledNavLink>

            <StyledNavLink to="/app/agenda" onClick={closeMenu}>
              <Calendar size={20} /> Agenda
            </StyledNavLink>

            <StyledNavLink to="/app/financeiro" onClick={closeMenu}>
              <DollarSign size={20} /> Financeiro
            </StyledNavLink>
          </NavMenu>
        </div>

        <LogoutButton onClick={signOut}>
          <LogOut size={18} /> Sair do Sistema
        </LogoutButton>
      </SidebarContainer>

      <MainContent>
        <Outlet />
      </MainContent>
    </Container>
  );
}