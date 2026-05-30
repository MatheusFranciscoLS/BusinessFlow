import React, { useMemo } from 'react';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrendingUp, Users, AlertTriangle, CheckCircle, Clock, 
  LifeBuoy, Calendar, FileText, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';

// --- ESTILOS ---
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const Container = styled.div`width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.5s ease;`;
const Header = styled.header`margin-bottom: 32px; h1 { font-size: 28px; color: #1a202c; font-weight: 800; margin-bottom: 8px; } p { color: #718096; font-size: 15px; margin: 0; }`;

const GridTop = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-bottom: 32px;`;
const StatCard = styled.div`background: white; border-radius: 16px; padding: 24px; border: 1px solid #edf2f7; display: flex; flex-direction: column; box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: 0.2s; &:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); } .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; } .title { color: #718096; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; } .icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; } .value { font-size: 32px; font-weight: 800; color: #2d3748; margin-bottom: 4px; } .subtitle { font-size: 13px; color: #a0aec0; font-weight: 500; display: flex; align-items: center; gap: 4px; }`;

const MainGrid = styled.div`display: grid; grid-template-columns: 2fr 1fr; gap: 24px; @media (max-width: 1024px) { grid-template-columns: 1fr; }`;
const Panel = styled.div`background: white; border-radius: 16px; border: 1px solid #edf2f7; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); h3 { font-size: 18px; color: #2d3748; font-weight: 800; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #edf2f7; padding-bottom: 12px; }`;

// Progresso e Listas
const ProgressBar = styled.div`width: 100%; height: 8px; background: #edf2f7; border-radius: 4px; overflow: hidden; margin-top: 8px; div { height: 100%; background: ${props => props.$color}; border-radius: 4px; transition: width 1s ease-in-out; }`;
const ListItem = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #edf2f7; &:last-child { border-bottom: none; } .name { font-weight: 600; color: #4a5568; font-size: 14px; } .status { font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 12px; }`;

// Ações do Cliente
const ActionGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;`;
const ActionShortcut = styled.button`background: white; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; cursor: pointer; transition: 0.2s; color: #4a5568; font-weight: 700; font-size: 15px; &:hover { border-color: #3182ce; color: #3182ce; transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(49, 130, 206, 0.1); }`;

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Dashboard() {
  const { user, selectedCompany } = useAuth();
  const navigate = useNavigate();
  const isClient = user?.role === 'CLIENT';

  const queryCompany = isClient ? user.companyAccessId : selectedCompany?.id;

  // Busca Inteligente de Dados (O Frontend faz o trabalho de agregação)
  const { data: clients } = useSWR(!isClient && queryCompany ? '/clients' : null, fetcher);
  const { data: tasks } = useSWR(queryCompany ? `/tasks?companyId=${queryCompany}` : null, fetcher);
  const { data: tickets } = useSWR(queryCompany ? `/tickets?companyId=${queryCompany}` : null, fetcher);
  const { data: transactions } = useSWR(queryCompany ? `/transactions?companyId=${queryCompany}` : null, fetcher);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // --- CÁLCULOS DO SÓCIO (ADMIN) ---
  const adminMetrics = useMemo(() => {
    if (isClient || !clients || !tasks || !tickets || !transactions) return null;

    // 1. Receita MRR (Mensalidades dos Clientes Ativos)
    const activeClients = clients.filter(c => c.status !== 'INADIMPLENTE');
    const mrr = activeClients.reduce((acc, c) => acc + (Number(c.monthlyFee) || 0), 0);
    const defaultingClients = clients.filter(c => c.status === 'INADIMPLENTE');

    // 2. Produtividade Kanban (Mês Atual)
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'CONCLUIDO').length;
    const productivityPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // 3. Saúde do BPO Financeiro
    const pendingIncomes = transactions.filter(t => t.status !== 'PAGO' && (t.type === 'entrada' || t.type === 'income'));
    const totalToReceive = pendingIncomes.reduce((acc, t) => acc + (Number(t.amount || t.price) || 0), 0);

    // 4. Termómetro de Helpdesk
    const openTickets = tickets.filter(t => t.status !== 'RESOLVIDO').length;

    return { mrr, defaultingClients, productivityPercent, totalToReceive, openTickets };
  }, [clients, tasks, tickets, transactions, isClient]);


  // =======================================================
  // 1. VISÃO DO CLIENTE (Simples e Focada em Ação)
  // =======================================================
  if (isClient) {
    return (
      <Container>
        <Header>
          <h1>Bem-vindo ao seu Portal, {user?.name.split(' ')[0]}!</h1>
          <p>O seu atalho direto para a contabilidade da sua empresa.</p>
        </Header>

        <Panel style={{ marginBottom: 32, background: 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: 24, color: 'white' }}>Precisa de ajuda rápida?</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>A nossa equipa de especialistas está pronta para analisar os seus pedidos.</p>
            </div>
            <button onClick={() => navigate('/app/helpdesk')} style={{ background: 'white', color: '#2b6cb0', padding: '14px 28px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <LifeBuoy size={20} /> Abrir Chamado Agora
            </button>
          </div>
        </Panel>

        <h3 style={{ color: '#4a5568', marginBottom: 16, fontSize: 18 }}>Acesso Rápido</h3>
        <ActionGrid>
          <ActionShortcut onClick={() => navigate('/app/documentos')}>
            <div style={{ background: '#ebf8ff', padding: 16, borderRadius: 50, color: '#3182ce' }}><FileText size={32} /></div>
            Baixar Documentos e Guias
          </ActionShortcut>
          <ActionShortcut onClick={() => navigate('/app/agenda')}>
            <div style={{ background: '#fffaf0', padding: 16, borderRadius: 50, color: '#dd6b20' }}><Calendar size={32} /></div>
            Consultar Prazos e Obrigações
          </ActionShortcut>
          <ActionShortcut onClick={() => navigate('/app/servicos')}>
            <div style={{ background: '#f0fff4', padding: 16, borderRadius: 50, color: '#38a169' }}><Activity size={32} /></div>
            Ver Relatórios DRE
          </ActionShortcut>
        </ActionGrid>
      </Container>
    );
  }

  // =======================================================
  // 2. VISÃO DO SÓCIO / GESTOR (Super Dashboard)
  // =======================================================
  if (!adminMetrics) {
    return <Container><p style={{ color: '#a0aec0', padding: 40, textAlign: 'center' }}>A compilar métricas do escritório...</p></Container>;
  }

  return (
    <Container>
      <Header>
        <h1>Centro de Comando</h1>
        <p>Visão geral de performance, receitas e obrigações operacionais.</p>
      </Header>

      <GridTop>
        {/* MRR CARD */}
        <StatCard>
          <div className="header">
            <span className="title">Receita Mensal (MRR)</span>
            <div className="icon-wrap" style={{ background: '#f0fff4', color: '#38a169' }}><TrendingUp size={24} /></div>
          </div>
          <div className="value">{formatCurrency(adminMetrics.mrr)}</div>
          <div className="subtitle" style={{ color: '#38a169' }}><ArrowUpRight size={16} /> Contratos Ativos de Honorários</div>
        </StatCard>

        {/* INADIMPLÊNCIA CARD */}
        <StatCard style={{ borderColor: adminMetrics.defaultingClients.length > 0 ? '#fed7d7' : '#edf2f7' }}>
          <div className="header">
            <span className="title">Inadimplência</span>
            <div className="icon-wrap" style={{ background: '#fff5f5', color: '#e53e3e' }}><AlertTriangle size={24} /></div>
          </div>
          <div className="value">{adminMetrics.defaultingClients.length}</div>
          <div className="subtitle" style={{ color: '#e53e3e' }}><ArrowDownRight size={16} /> Clientes com problemas de pagamento</div>
        </StatCard>

        {/* PRODUTIVIDADE CARD */}
        <StatCard>
          <div className="header">
            <span className="title">Produtividade Kanban</span>
            <div className="icon-wrap" style={{ background: '#ebf8ff', color: '#3182ce' }}><CheckCircle size={24} /></div>
          </div>
          <div className="value">{adminMetrics.productivityPercent}%</div>
          <div className="subtitle">Obrigações e tarefas concluídas</div>
          <ProgressBar $color={adminMetrics.productivityPercent < 50 ? '#e53e3e' : adminMetrics.productivityPercent < 80 ? '#d69e2e' : '#38a169'}>
            <div style={{ width: `${adminMetrics.productivityPercent}%` }}></div>
          </ProgressBar>
        </StatCard>

        {/* BPO FINANCEIRO CARD */}
        <StatCard>
          <div className="header">
            <span className="title">A Receber (BPO)</span>
            <div className="icon-wrap" style={{ background: '#fffff0', color: '#d69e2e' }}><Clock size={24} /></div>
          </div>
          <div className="value">{formatCurrency(adminMetrics.totalToReceive)}</div>
          <div className="subtitle">Boletos aguardando baixa no mês</div>
        </StatCard>
      </GridTop>

      <MainGrid>
        {/* PAINEL ESQUERDO: Alertas Operacionais */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <Panel>
            <h3><LifeBuoy color="#e53e3e" /> Status do Helpdesk</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fff5f5', borderRadius: 12, border: '1px solid #fed7d7' }}>
              <div>
                <strong style={{ fontSize: 24, color: '#c53030', display: 'block' }}>{adminMetrics.openTickets}</strong>
                <span style={{ color: '#e53e3e', fontSize: 14, fontWeight: 600 }}>Chamados de Clientes em Aberto/Andamento</span>
              </div>
              <button onClick={() => navigate('/app/helpdesk')} style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                Ir para Suporte
              </button>
            </div>
          </Panel>

          <Panel>
            <h3><Users color="#3182ce" /> Alerta de Inadimplência (CRM)</h3>
            {adminMetrics.defaultingClients.length === 0 ? (
              <p style={{ color: '#718096', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={18} color="#38a169"/> Todos os clientes estão em dia com os honorários.</p>
            ) : (
              <div>
                {adminMetrics.defaultingClients.map(c => (
                  <ListItem key={c.id}>
                    <span className="name">{c.fullName}</span>
                    <span className="status" style={{ background: '#fff5f5', color: '#e53e3e' }}>Inadimplente</span>
                  </ListItem>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* PAINEL DIREITO: Radar de Próximas Entregas (Kanban) */}
        <Panel>
          <h3><Calendar color="#d69e2e" /> Próximas Obrigações (Top 5)</h3>
          {tasks.filter(t => t.status !== 'CONCLUIDO').slice(0, 5).map(t => {
             const isOverdue = new Date(t.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
             return (
              <ListItem key={t.id} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span className="name" style={{ color: isOverdue ? '#e53e3e' : '#2d3748' }}>{t.title}</span>
                  <span className="status" style={{ background: isOverdue ? '#fff5f5' : '#edf2f7', color: isOverdue ? '#e53e3e' : '#4a5568' }}>
                    {new Date(t.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#a0aec0', fontWeight: 600 }}>{t.client?.fullName || 'Obrigação Interna'}</span>
              </ListItem>
             )
          })}
          <button onClick={() => navigate('/app/agenda')} style={{ width: '100%', background: '#f7fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, marginTop: 16, color: '#4a5568', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>
            Ver Quadro Completo
          </button>
        </Panel>

      </MainGrid>

    </Container>
  );
}