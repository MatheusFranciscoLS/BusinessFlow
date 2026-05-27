import React, { useState, Suspense, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

import {
  LayoutDashboard,
  Users,
  DollarSign,
  LogOut,
  Calendar,
  Menu,
  X,
  Settings,
  CircleUser,
  Building2,
  PieChart,
} from 'lucide-react';

import {
  Container,
  SidebarContainer,
  MainContent,
  Logo,
  NavMenu,
  StyledNavLink,
  LogoutButton,
  MobileHeader,
  HamburgerButton,
  Overlay,
  CompanySelector,
} from './styles';

export default function Layout() {
  const {
    signOut,
    user,
    companies = [],
    selectedCompany,
    changeCompany,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);

  const isClient = user?.role === 'CLIENT';

  const avatarUrl = useMemo(() => {
    if (!user?.avatarUrl) return null;

    return `${api.defaults.baseURL.replace('/api', '')}${user.avatarUrl}`;
  }, [user?.avatarUrl]);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

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

          {!isClient && companies.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: '#a0aec0',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                <Building2 size={14} />
                Empresa Ativa
              </div>

              <CompanySelector
                value={selectedCompany?.id || ''}
                onChange={(e) => changeCompany(e.target.value)}
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </CompanySelector>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #3182ce',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Usuário"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <CircleUser
                  size={38}
                  color="#a0aec0"
                  strokeWidth={1.5}
                />
              )}
            </div>

            <div
              style={{
                color: '#a0aec0',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {isClient ? 'Área do Cliente' : 'Olá,'}
              <br />

              <strong style={{ color: '#fff', fontSize: 14 }}>
                {user?.name || 'Gestor'}
              </strong>
            </div>
          </div>

          <NavMenu>
            <StyledNavLink to="/app" end onClick={closeMenu}>
              <LayoutDashboard size={20} />
              Dashboard
            </StyledNavLink>

            {!isClient && (
              <StyledNavLink
                to="/app/clientes"
                onClick={closeMenu}
              >
                <Users size={20} />
                Clientes
              </StyledNavLink>
            )}

            <StyledNavLink
              to="/app/servicos"
              onClick={closeMenu}
            >
              <PieChart size={20} />
              Relatórios DRE
            </StyledNavLink>

            <StyledNavLink
              to="/app/agenda"
              onClick={closeMenu}
            >
              <Calendar size={20} />
              Agenda e Prazos
            </StyledNavLink>

            <StyledNavLink
              to="/app/financeiro"
              onClick={closeMenu}
            >
              <DollarSign size={20} />
              Financeiro
            </StyledNavLink>

            {!isClient && (
              <StyledNavLink
                to="/app/perfil"
                onClick={closeMenu}
              >
                <Settings size={20} />
                Configurações
              </StyledNavLink>
            )}
          </NavMenu>
        </div>

        <LogoutButton onClick={signOut}>
          <LogOut size={18} />
          Sair do Sistema
        </LogoutButton>
      </SidebarContainer>

      <MainContent>
        <Suspense
          fallback={
            <div
              style={{
                width: '100%',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div
                style={{
                  width: 200,
                  height: 32,
                  background: '#e2e8f0',
                  borderRadius: 6,
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />

              <div
                style={{
                  width: '100%',
                  height: 120,
                  background: '#e2e8f0',
                  borderRadius: 12,
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </MainContent>
    </Container>
  );
}