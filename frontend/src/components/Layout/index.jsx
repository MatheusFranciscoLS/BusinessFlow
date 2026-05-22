import React from 'react';
import { Outlet } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { LayoutDashboard, Users, DollarSign, LogOut, Briefcase, Calendar } from 'lucide-react';
import { Container, SidebarContainer, MainContent, Logo, NavMenu, StyledNavLink, LogoutButton } from './styles';

export default function Layout() {
  const { signOut, user } = useAuth(); 

  return (
    <Container>
      <SidebarContainer>
        <div>
          <Logo>
            Business<span>Flow</span>
          </Logo>
          
          <div style={{ marginBottom: 40, color: '#a0aec0', fontSize: 13, fontWeight: 500 }}>
            Olá, <strong style={{ color: 'white' }}>{user?.name || 'Gestor'}</strong>
          </div>

          <NavMenu>
            <StyledNavLink to="/app" end> 
              <LayoutDashboard size={20} /> Dashboard
            </StyledNavLink>

            <StyledNavLink to="/app/clientes">
              <Users size={20} /> Clientes
            </StyledNavLink>

            <StyledNavLink to="/app/servicos">
              <Briefcase size={20} /> Serviços
            </StyledNavLink>

            <StyledNavLink to="/app/agenda">
              <Calendar size={20} /> Agenda
            </StyledNavLink>

            <StyledNavLink to="/app/financeiro">
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