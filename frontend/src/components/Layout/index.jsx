import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext'; 
import api from '../../services/api'; // 🔥 IMPORTAÇÃO CORRIGIDA AQUI
import { LayoutDashboard, Users, DollarSign, LogOut, Briefcase, Calendar, Menu, X, Settings, CircleUser } from 'lucide-react';
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
          
          {/* 🔥 BLOCO DO AVATAR CORRIGIDO COM O FECHAMENTO DA DIV 🔥 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: '#2d3748', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3182ce' }}>
              {user?.avatarUrl ? (
                <img src={`${api.defaults.baseURL.replace('/api', '')}${user.avatarUrl}`} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <CircleUser size={38} color="#a0aec0" strokeWidth={1.5} />
              )}
            </div>
            <div style={{ color: '#a0aec0', fontSize: 13, fontWeight: 500 }}>
              Olá, <br />
              <strong style={{ color: 'white', fontSize: 14 }}>{user?.name || 'Gestor'}</strong>
            </div>
          </div> 
          {/* FIM DO BLOCO DO AVATAR */}

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

            <StyledNavLink to="/app/perfil" onClick={closeMenu}>
              <Settings size={20} /> Configurações
            </StyledNavLink>
          </NavMenu>
        </div>

        <LogoutButton onClick={signOut}>
          <LogOut size={18} /> Sair do Sistema
        </LogoutButton>
      </SidebarContainer>

<MainContent>
<Suspense 
          fallback={
            <div style={{ width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Título da Página Animado */}
              <div style={{ width: '200px', height: '32px', background: '#e2e8f0', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ width: '350px', height: '16px', background: '#edf2f7', borderRadius: '4px', marginBottom: '20px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              
              {/* Linhas simulando o conteúdo */}
              <div style={{ width: '100%', height: '120px', background: '#e2e8f0', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ width: '100%', height: '80px', background: '#edf2f7', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ width: '100%', height: '80px', background: '#edf2f7', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }} />

              {/* Regra CSS inline para a animação pulse funcionar sem pesar */}
              <style>{`
                @keyframes pulse {
                  0% { opacity: 0.6; }
                  50% { opacity: 1; }
                  100% { opacity: 0.6; }
                }
              `}</style>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </MainContent>
    </Container>
  );
}