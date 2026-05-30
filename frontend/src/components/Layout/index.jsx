import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext'; 
import api from '../../services/api'; 
import useSWR from 'swr';
import { 
  LayoutDashboard, Users, DollarSign, LogOut, Calendar, Menu, X, 
  Settings, CircleUser, Building2, PieChart, LifeBuoy, FolderLock
} from 'lucide-react';
import { 
  Container, SidebarContainer, MainContent, Logo, NavMenu, 
  StyledNavLink, LogoutButton, MobileHeader, HamburgerButton, Overlay,
  CompanySelector 
} from './styles';

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Layout() {
  const { signOut, user, companies = [], selectedCompany, changeCompany } = useAuth(); 
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isClient = user?.role === 'CLIENT';
  
  // 🔥 O SEGREDO ESTÁ AQUI: Cliente usa o Acesso dele, o Gestor usa a Empresa selecionada
  const activeCompanyId = isClient ? user?.companyAccessId : selectedCompany?.id;

  // Envia o e-mail na pesquisa para o Back-end saber exatamente quem é o dono das notificações
  const badgeQuery = user && activeCompanyId 
    ? `/tickets/unread-count?companyId=${activeCompanyId}&role=${user.role}&userEmail=${user.email}` 
    : null;
    
  const { data: unreadData } = useSWR(badgeQuery, fetcher, { refreshInterval: 15000 });
  const unreadCount = unreadData?.count || 0;

  return (
    <Container>
      <MobileHeader>
        <Logo style={{ fontSize: 20, margin: 0 }}>
          Business<span>Flow</span>
        </Logo>
        <HamburgerButton onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </HamburgerButton>
      </MobileHeader>

      {isOpen && <Overlay onClick={closeMenu} />}

      <SidebarContainer $isOpen={isOpen}>
        <div>
          <Logo>
            Business<span>Flow</span>
          </Logo>
          
          {!isClient && companies?.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
                <Building2 size={14} /> Empresa Ativa
              </div>
              <CompanySelector 
                value={selectedCompany?.id || ''} 
                onChange={(e) => changeCompany(e.target.value)}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </CompanySelector>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: '#2d3748', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3182ce' }}>
              {user?.avatarUrl ? (
                <img src={`${api.defaults.baseURL.replace('/api', '')}${user.avatarUrl}`} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <CircleUser size={38} color="#a0aec0" strokeWidth={1.5} />
              )}
            </div>
            <div style={{ color: '#a0aec0', fontSize: 13, fontWeight: 500 }}>
              {isClient ? 'Área do Cliente' : 'Olá,'} <br />
              <strong style={{ color: 'white', fontSize: 14 }}>{user?.name || 'Gestor'}</strong>
            </div>
          </div> 

          <NavMenu>
            <StyledNavLink to="/app" end onClick={closeMenu}> 
              <LayoutDashboard size={20} /> Dashboard
            </StyledNavLink>
            
            {!isClient && (
              <StyledNavLink to="/app/clientes" onClick={closeMenu}>
                <Users size={20} /> Clientes
              </StyledNavLink>
            )}

            <StyledNavLink to="/app/documentos" onClick={closeMenu}>
              <FolderLock size={20} /> Cofre Digital
            </StyledNavLink>

            <StyledNavLink to="/app/servicos" onClick={closeMenu}>
              <PieChart size={20} /> Relatórios DRE
            </StyledNavLink>

            {/* 🔥 MENU COM NOTIFICAÇÃO DINÂMICA */}
            <StyledNavLink to="/app/helpdesk" onClick={closeMenu}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LifeBuoy size={20} /> Atendimento
                </div>
                {unreadCount > 0 && (
                  <span style={{ background: '#e53e3e', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
            </StyledNavLink>

            <StyledNavLink to="/app/agenda" onClick={closeMenu}>
              <Calendar size={20} /> Agenda e Prazos
            </StyledNavLink>

            <StyledNavLink to="/app/financeiro" onClick={closeMenu}>
              <DollarSign size={20} /> Financeiro
            </StyledNavLink>

            {!isClient && (
              <StyledNavLink to="/app/perfil" onClick={closeMenu}>
                <Settings size={20} /> Configurações
              </StyledNavLink>
            )}
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
              <div style={{ width: '200px', height: '32px', background: '#e2e8f0', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ width: '100%', height: '120px', background: '#e2e8f0', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`}</style>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </MainContent>
    </Container>
  );
}