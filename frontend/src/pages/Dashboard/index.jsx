import React, { useMemo } from 'react';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// 🔥 LIMPEZA: O 'Clock' foi removido e o 'ShieldAlert' foi adicionado!
import { 
  TrendingUp, Users, AlertTriangle, CheckCircle, 
  LifeBuoy, Calendar, FileText, ArrowUpRight, ArrowDownRight, Activity, ShieldAlert
} from 'lucide-react';

import {
  Container, Header, GridTop, StatCard, MainGrid, Panel,
  ProgressBar, ListItem, ActionGrid, ActionShortcut
} from './styles';

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Dashboard() {
  const { user, selectedCompany } = useAuth();
  const navigate = useNavigate();
  const isClient = user?.role === 'CLIENT';

  const queryCompany = isClient ? user.companyAccessId : selectedCompany?.id;

  // Segurança integrada na requisição HTTP enviada ao Back-end
  const secureQuery = queryCompany 
    ? `?companyId=${queryCompany}&role=${user?.role}&userEmail=${user?.email}` 
    : null;

  // 🔥 Busca a lista de clientes apenas se for um utilizador CLIENT, para validar o acesso visual
  const { data: clients } = useSWR(isClient && queryCompany ? `/clients?companyId=${queryCompany}` : null, fetcher);
  const { data: summary } = useSWR(secureQuery ? `/dashboard/summary${secureQuery}` : null, fetcher);
  const { data: tasks } = useSWR(secureQuery ? `/tasks${secureQuery}` : null, fetcher);

  const myClientRecord = useMemo(() => {
    if (!isClient || !clients) return null;
    return clients.find(c => c.email === user.email);
  }, [isClient, clients, user]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const metrics = useMemo(() => {
    if (!tasks || !summary) return null;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'CONCLUIDO').length;
    const productivityPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return { productivityPercent };
  }, [tasks, summary]);

  // 🔥 PROTEÇÃO VISUAL: Bloqueia a tela se o dossiê ainda não existir
  if (isClient && clients && !myClientRecord) {
    return (
      <Container style={{ textAlign: 'center', padding: 60 }}>
        <ShieldAlert size={48} color="#e53e3e" style={{ marginBottom: 16 }} />
        <h2>Acesso Pendente</h2>
        <p>O seu e-mail não foi encontrado no dossiê. Fale com o seu contador.</p>
      </Container>
    );
  }

  // =======================================================
  // 1. VISÃO DO CLIENTE
  // =======================================================
  if (isClient) {
    return (
      <Container>
        <Header>
          <h1>Bem-vindo ao seu Portal, {user?.name.split(' ')[0]}!</h1>
          <p>O seu canal direto e seguro com o seu escritório de contabilidade.</p>
        </Header>

        <Panel style={{ marginBottom: 32, background: 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: 22, color: 'white' }}>Precisa de suporte ou esclarecimentos?</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>Abra uma solicitação direta na nossa central técnica.</p>
            </div>
            <button onClick={() => navigate('/app/helpdesk')} style={{ background: 'white', color: '#2b6cb0', padding: '14px 24px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <LifeBuoy size={18} /> Abrir Chamado
            </button>
          </div>
        </Panel>

        <h3 style={{ color: '#4a5568', marginBottom: 20, fontSize: 18, fontWeight: 800 }}>Acessos Rápidos</h3>
        <ActionGrid>
          <ActionShortcut onClick={() => navigate('/app/documentos')}>
            <div style={{ background: '#ebf8ff', padding: 16, borderRadius: 50, color: '#3182ce' }}><FileText size={28} /></div>
            Cofre de Documentos e Guias
          </ActionShortcut>
          <ActionShortcut onClick={() => navigate('/app/agenda')}>
            <div style={{ background: '#fffaf0', padding: 16, borderRadius: 50, color: '#dd6b20' }}><Calendar size={28} /></div>
            Minha Agenda de Obrigações
          </ActionShortcut>
          <ActionShortcut onClick={() => navigate('/app/servicos')}>
            <div style={{ background: '#f0fff4', padding: 16, borderRadius: 50, color: '#38a169' }}><Activity size={28} /></div>
            Demonstrativos Financeiros (DRE)
          </ActionShortcut>
        </ActionGrid>
      </Container>
    );
  }

  // =======================================================
  // 2. VISÃO DO SÓCIO / GESTOR 
  // =======================================================
  if (!summary || !metrics) {
    return <Container><p style={{ color: '#a0aec0', padding: 40, textAlign: 'center' }}>Compilando indicadores estratégicos...</p></Container>;
  }

  return (
    <Container>
      <Header>
        <h1>Centro de Comando Operacional</h1>
        <p>Acompanhamento analítico da agência, faturamento recorrente e riscos fiscais.</p>
      </Header>

      <GridTop>
        <StatCard>
          <div className="header">
            <span className="title">Receita Mensal Otimizada (MRR)</span>
            <div className="icon-wrap" style={{ background: '#f0fff4', color: '#38a169' }}><TrendingUp size={24} /></div>
          </div>
          <div className="value">{formatCurrency(summary.entradas)}</div>
          <div className="subtitle" style={{ color: '#38a169' }}><ArrowUpRight size={16} /> Honorários Contábeis Recebidos</div>
        </StatCard>

        <StatCard style={{ borderColor: summary.inadimplentes?.length > 0 ? '#fed7d7' : '#edf2f7' }}>
          <div className="header">
            <span className="title">Risco de Inadimplência</span>
            <div className="icon-wrap" style={{ background: '#fff5f5', color: '#e53e3e' }}><AlertTriangle size={24} /></div>
          </div>
          <div className="value">{summary.inadimplentes?.length || 0}</div>
          <div className="subtitle" style={{ color: '#e53e3e' }}><ArrowDownRight size={16} /> Empresas com pendências de faturamento</div>
        </StatCard>

        <StatCard>
          <div className="header">
            <span className="title">Vazão do Quadro Fiscal</span>
            <div className="icon-wrap" style={{ background: '#ebf8ff', color: '#3182ce' }}><CheckCircle size={24} /></div>
          </div>
          <div className="value">{metrics.productivityPercent}%</div>
          <div className="subtitle">Obrigações e prazos cumpridos</div>
          <ProgressBar $color={metrics.productivityPercent < 50 ? '#e53e3e' : metrics.productivityPercent < 80 ? '#d69e2e' : '#38a169'}>
            <div style={{ width: `${metrics.productivityPercent}%` }}></div>
          </ProgressBar>
        </StatCard>
      </GridTop>

      <MainGrid>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Panel>
            <h3><Users color="#3182ce" /> Monitoramento de Alertas Ativos</h3>
            {summary.inadimplentes?.length === 0 ? (
              <p style={{ color: '#718096', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={18} color="#38a169"/> Todas as contas recorrentes operam em total conformidade.</p>
            ) : (
              <div>
                {summary.inadimplentes?.map((c, index) => (
                  <ListItem key={index}>
                    <span className="name">{c.fullName}</span>
                    <span className="status" style={{ background: '#fff5f5', color: '#e53e3e' }}>Atenção Financeira</span>
                  </ListItem>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel>
          <h3><Calendar color="#d69e2e" /> Próximas Entregas (Top 5)</h3>
          {tasks?.filter(t => t.status !== 'CONCLUIDO').slice(0, 5).map(t => {
             const isOverdue = new Date(t.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
             return (
              <ListItem key={t.id} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span className="name" style={{ color: isOverdue ? '#e53e3e' : '#2d3748' }}>{t.title}</span>
                  <span className="status" style={{ background: isOverdue ? '#fff5f5' : '#edf2f7', color: isOverdue ? '#e53e3e' : '#4a5568' }}>
                    {new Date(t.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#a0aec0', fontWeight: 600 }}>{t.client?.fullName || 'Urgência Interna'}</span>
              </ListItem>
             )
          })}
          <button onClick={() => navigate('/app/agenda')} style={{ width: '100%', background: '#f7fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, marginTop: 16, color: '#4a5568', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>
            Acessar Painel Unificado
          </button>
        </Panel>
      </MainGrid>
    </Container>
  );
}