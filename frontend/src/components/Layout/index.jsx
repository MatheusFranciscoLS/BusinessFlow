import React from 'react';
import { Outlet, NavLink } from 'react-router-dom'; // Importei NavLink aqui para usar no StyledNavLink
import { useAuth } from '../../contexts/AuthContext'; // <--- IMPORTANTE: Usar o Contexto
import { LayoutDashboard, Users, DollarSign, LogOut, Briefcase, Calendar } from 'lucide-react';
import { Container, SidebarContainer, MainContent, Logo, NavMenu, StyledNavLink, LogoutButton } from './styles';

export default function Layout() {
  const { signOut, user } = useAuth(); // Pega a função signOut do Contexto

  return (
    <Container>
      <SidebarContainer>
        <div>
          <Logo>
            Business<span>Flow</span>
          </Logo>
          
          {/* Mostra quem está logado (Opcional, mas fica legal) */}
          <div style={{ marginBottom: 30, color: '#718096', fontSize: 12 }}>
            Olá, {user?.name || 'Usuário'}
          </div>

          <NavMenu>
            <StyledNavLink to="/app" end> 
              <LayoutDashboard size={20} />
              Dashboard
            </StyledNavLink>

            <StyledNavLink to="/app/clientes">
              <Users size={20} />
              Clientes
            </StyledNavLink>

            <StyledNavLink to="/app/servicos">
              <Briefcase size={20} />
              Serviços
            </StyledNavLink>

            <StyledNavLink to="/app/agenda">
              <Calendar size={20} />
              Agenda
            </StyledNavLink>

            <StyledNavLink to="/app/financeiro">
              <DollarSign size={20} />
              Financeiro
            </StyledNavLink>
          </NavMenu>
        </div>

        {/* Botão agora chama a função signOut do AuthContext */}
        <LogoutButton onClick={signOut}>
          <LogOut size={18} />
          Sair do Sistema
        </LogoutButton>
      </SidebarContainer>

      <MainContent>
        <Outlet />
      </MainContent>
    </Container>
  );
}