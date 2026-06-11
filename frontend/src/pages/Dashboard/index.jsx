import React, { useMemo } from 'react';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrendingUp, Users, AlertTriangle, CheckCircle, 
  LifeBuoy, Calendar, FileText, ArrowUpRight, ArrowDownRight, Activity, ShieldAlert,
  MessageCircle, ArrowRight // 🔥 Adicionámos estes dois!
} from 'lucide-react';
import {
  Container, Header, GridTop, StatCard, MainGrid, Panel,ListItem, ActionGrid, ActionShortcut
} from './styles';

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Dashboard() {
  const { user, selectedCompany } = useAuth();
  const navigate = useNavigate();
  const isClient = user?.role === 'CLIENT';

  const queryCompany = isClient ? user.companyAccessId : selectedCompany?.id;

  const secureQuery = queryCompany 
    ? `?companyId=${queryCompany}&role=${user?.role}&userEmail=${user?.email}` 
    : null;

  const { data: clients } = useSWR(isClient && queryCompany ? `/clients?companyId=${queryCompany}` : null, fetcher);
  const { data: summary } = useSWR(secureQuery ? `/dashboard/summary${secureQuery}` : null, fetcher);
const { data: tasks } = useSWR(secureQuery ? `/tasks${secureQuery}` : null, fetcher);
  
  const { data: transactions } = useSWR(isClient && secureQuery ? `/transactions${secureQuery}` : null, fetcher);
  
  const pendingClientBills = useMemo(() => {
    if (!isClient || !transactions) return [];
    return transactions.filter(t => t.status !== 'PAGO' && (t.type === 'income' || t.type === 'entrada'));
  }, [transactions, isClient]);

  const totalPendingAmount = pendingClientBills.reduce((acc, t) => acc + (t.amount || t.price || 0), 0);

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

  if (isClient && clients && !myClientRecord) {
    return (
      <Container style={{ textAlign: 'center', padding: 60 }}>
        <ShieldAlert size={48} color="#e53e3e" style={{ marginBottom: 16 }} />
        <h2>Acesso Pendente</h2>
        <p>O seu e-mail não foi encontrado no dossiê. Fale com o seu contador.</p>
      </Container>
    );
  }

if (isClient) {
    return (
      <Container>
        <Header>
          <h1>Bem-vindo ao seu Portal, {user?.name.split(' ')[0]}!</h1>
          <p>O seu canal direto e seguro com o seu escritório de contabilidade.</p>
        </Header>

        {pendingClientBills?.length > 0 && (
          <div style={{ background: '#fffaf0', border: '1px solid #fbd38d', padding: '20px 24px', borderRadius: 16, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 4px 15px rgba(221, 107, 32, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: '#dd6b20', color: 'white', padding: 16, borderRadius: 12 }}><AlertTriangle size={28} /></div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: '#975a16', fontSize: 18, fontWeight: 800 }}>Atenção: Você tem {pendingClientBills.length} fatura(s) pendente(s).</h3>
                <p style={{ margin: 0, color: '#b7791f', fontWeight: 600, fontSize: 15 }}>Valor total em aberto: {formatCurrency(totalPendingAmount)}</p>
              </div>
            </div>
            {/* Atalho direto para ela pagar no Financeiro */}
            <button onClick={() => navigate('/app/financeiro')} style={{ background: '#38a169', color: 'white', border: 'none', padding: '14px 28px', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s', boxShadow: '0 4px 10px rgba(56, 161, 105, 0.3)' }}>
              Resolver Agora <ArrowRight size={18} />
            </button>
          </div>
        )}

        <Panel style={{ marginBottom: 32, background: 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)', color: 'white', border: 'none', boxShadow: '0 10px 25px rgba(49, 130, 206, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: 22, color: 'white' }}>Precisa de suporte ou esclarecimentos?</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>Abra uma conversa direta com a nossa equipe.</p>
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
            Cofre de Documentos
          </ActionShortcut>
          <ActionShortcut onClick={() => navigate('/app/agenda')}>
            <div style={{ background: '#fffaf0', padding: 16, borderRadius: 50, color: '#dd6b20' }}><Calendar size={28} /></div>
            Tarefas e Prazos
          </ActionShortcut>
          <ActionShortcut onClick={() => navigate('/app/financeiro')}>
            <div style={{ background: '#f0fff4', padding: 16, borderRadius: 50, color: '#38a169' }}><Activity size={28} /></div>
            Extrato Financeiro
          </ActionShortcut>
        </ActionGrid>
      </Container>
    );
  }

  if (!summary || !metrics) {
    return <Container><p style={{ color: '#a0aec0', padding: 40, textAlign: 'center' }}>Compilando indicadores estratégicos...</p></Container>;
  }

  return (
    <Container>
      <Header>
        <h1>Resumo Executivo</h1>
        <p>Visão geral do desempenho financeiro e operacional do escritório.</p>
      </Header>

      <GridTop>
        <StatCard onClick={() => navigate('/app/financeiro')} title="Aceder ao Financeiro">
          <div className="header">
            <span className="title">Receita Mensal (MRR)</span>
            <div className="icon-wrap" style={{ background: '#f0fff4', color: '#38a169' }}><TrendingUp size={24} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 8 }}>
            <div className="value" style={{ marginBottom: 0 }}>{formatCurrency(summary.entradas)}</div>
            {/* 🔥 BADGE DE CRESCIMENTO */}
            <span style={{ background: '#c6f6d5', color: '#22543d', padding: '4px 8px', borderRadius: 20, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', marginBottom: 6 }}>+12%</span>
          </div>
          <div className="subtitle" style={{ color: '#38a169' }}><ArrowUpRight size={16} /> Honorários Recebidos</div>
        </StatCard>

        <StatCard onClick={() => navigate('/app/financeiro')} style={{ borderColor: summary.inadimplentes?.length > 0 ? '#fed7d7' : '#edf2f7' }} title="Analisar Inadimplência">
          <div className="header">
            <span className="title">Risco de Inadimplência</span>
            <div className="icon-wrap" style={{ background: '#fff5f5', color: '#e53e3e' }}><AlertTriangle size={24} /></div>
          </div>
          <div className="value">{summary.inadimplentes?.length || 0}</div>
          <div className="subtitle" style={{ color: '#e53e3e' }}><ArrowDownRight size={16} /> Com pendências de faturamento</div>
        </StatCard>

        <StatCard onClick={() => navigate('/app/agenda')} title="Aceder ao Quadro Kanban" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div className="header" style={{ marginBottom: 16 }}>
              <span className="title">Produtividade da Equipe</span>
            </div>
            <div className="value" style={{ fontSize: 26, marginBottom: 4 }}>{metrics.productivityPercent}%</div>
            <div className="subtitle">Tarefas concluídas no prazo</div>
          </div>
          
          {/* Mágica do Gráfico em CSS Puro (Conic Gradient) */}
          <div style={{ 
            position: 'relative', width: 76, height: 76, borderRadius: '50%', 
            background: `conic-gradient(${metrics.productivityPercent < 50 ? '#e53e3e' : metrics.productivityPercent < 80 ? '#d69e2e' : '#38a169'} ${metrics.productivityPercent * 3.6}deg, #edf2f7 0deg)`
          }}>
            <div style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={22} color={metrics.productivityPercent < 50 ? '#e53e3e' : metrics.productivityPercent < 80 ? '#d69e2e' : '#38a169'} />
            </div>
          </div>
        </StatCard>
      </GridTop>

      <MainGrid>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Panel>
            <h3><Users color="#3182ce" /> Atenção: Clientes com Pendências</h3>
            {summary.inadimplentes?.length === 0 ? (
              <p style={{ color: '#718096', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={18} color="#38a169"/> Todas as contas recorrentes operam em total conformidade.</p>
            ) : (
<div>
                {summary.inadimplentes?.map((c, index) => (
                  <ListItem key={index}>
                    <span className="name">{c.fullName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="status" style={{ background: '#fff5f5', color: '#e53e3e', fontWeight: 700 }}>Atenção Financeira</span>
                      
                      {/* 🔥 O BOTÃO DE COBRANÇA 1-CLICK */}
                      <button 
                        onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Olá ${c.fullName.split(' ')[0]}, tudo bem? Consta no nosso sistema uma pendência em aberto. Podemos ajudar com a 2ª via ou link do PIX para facilitar?`)}`, '_blank')}
                        title="Cobrar via WhatsApp"
                        style={{ background: '#f0fff4', color: '#25D366', border: '1px solid #9ae6b4', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', boxShadow: '0 2px 4px rgba(37, 211, 102, 0.2)' }}
                      >
                        <MessageCircle size={18} />
                      </button>
                    </div>
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
                <span style={{ fontSize: 12, color: '#a0aec0', fontWeight: 600 }}>{t.client?.fullName || 'Tarefa Interna do Escritório'}</span>
              </ListItem>
             )
          })}
          <button onClick={() => navigate('/app/agenda')} style={{ width: '100%', background: '#f7fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, marginTop: 16, color: '#4a5568', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>
            Ver todas as Tarefas
          </button>
        </Panel>
      </MainGrid>
    </Container>
  );
}