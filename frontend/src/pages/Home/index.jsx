import React from 'react';
import useSWR from 'swr';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import CompetenceTable, { competenceSummaryText } from '../../components/CompetenceTable';
import {
  Page, PageHeader, Card, Row, PrimaryButton, SecondaryButton, Money, StatusChip, Muted, formatCurrency, MONTHS,
} from '../../components/ui';

const fetcher = (url) => api.get(url).then((res) => res.data);

// Cada pendência do "Para fazer hoje" com o rótulo e o tom certos.
const TODO_TONE = {
  vence_hoje: ['atrasado', 'Vence hoje'],
  atrasado: ['atrasado', 'Atrasado'],
  chamado: ['pendente', 'Chamado'],
  documento: ['aviso', 'Documento'],
  cobranca: ['pendente', 'Cobrança'],
};
const TODO_ACTION = { vence_hoje: 'Abrir tarefas', atrasado: 'Abrir tarefas', chamado: 'Responder', documento: 'Ver documentos', cobranca: 'Cobrar' };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Início do gestor: números honestos do mês, o que fazer hoje, o fechamento e o mapa da competência.
export default function Home() {
  const { user, selectedCompany } = useAuth();
  const navigate = useNavigate();
  const ready = Boolean(selectedCompany);
  const { data: overview, error } = useSWR(ready ? `/home/overview?c=${selectedCompany.id}` : null, fetcher);
  const { data: comp } = useSWR(ready ? `/home/competence?c=${selectedCompany.id}` : null, fetcher);

  const todayText = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const today = todayText.charAt(0).toUpperCase() + todayText.slice(1);
  const firstName = (user?.name || '').split(' ')[0];

  if (!ready) {
    return (
      <Page>
        <PageHeader><div><h1>Bem-vindo ao BusinessFlow</h1><p>Cadastre a primeira empresa do escritório em <Link to="/app/perfil">Configurações</Link> para começar.</p></div></PageHeader>
      </Page>
    );
  }

  const competenceLabel = comp ? (() => { const [y, m] = comp.competence.split('-'); return `${MONTHS[Number(m) - 1]} de ${y}`; })() : '';
  const monthName = overview ? MONTHS[Number(overview.month.split('-')[1]) - 1] : '';

  return (
    <Page>
      <PageHeader>
        <div>
          <div className="kicker">{today}</div>
          <h1>{greeting()}, {firstName}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <SecondaryButton type="button" onClick={() => navigate('/app/financeiro')}>Importar extrato</SecondaryButton>
          <PrimaryButton type="button" onClick={() => navigate('/app/financeiro')}>Novo lançamento</PrimaryButton>
        </div>
      </PageHeader>

      {error && <Card role="alert">Não foi possível carregar o início. Atualize a página em alguns segundos.</Card>}

      {/* 1. Números do mês */}
      <Row $basis="220px" style={{ marginTop: 0 }} aria-label="Números do mês">
        <Card>
          <Muted>Recebido em {monthName}</Muted>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}><Money>{overview ? formatCurrency(overview.received) : '...'}</Money></div>
          <div style={{ fontSize: 13.5, marginTop: 4, color: overview?.receivedGrowth < 0 ? '#991b1b' : '#166534' }}>
            {overview && overview.receivedGrowth !== null
              ? `${overview.receivedGrowth > 0 ? '+' : ''}${overview.receivedGrowth.toLocaleString('pt-BR')}% em relação ao mês passado`
              : <Muted $size="13.5px">Sem mês anterior para comparar</Muted>}
          </div>
        </Card>
        <Card>
          <Muted>A receber</Muted>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}><Money>{overview ? formatCurrency(overview.receivable.amount) : '...'}</Money></div>
          <Muted $size="13.5px">{overview ? `${overview.receivable.count} cobranças em dia, ainda não pagas` : ''}</Muted>
        </Card>
        <Card style={overview?.overdue.count ? { borderColor: '#fecaca' } : undefined}>
          <Muted>Em atraso</Muted>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: overview?.overdue.count ? '#b91c1c' : '#0f172a' }}><Money>{overview ? formatCurrency(overview.overdue.amount) : '...'}</Money></div>
          <div style={{ fontSize: 13.5, marginTop: 4, color: overview?.overdue.count ? '#b91c1c' : '#475569' }}>
            {overview && (overview.overdue.count
              ? (overview.overdue.clients.length === 1 ? overview.overdue.clients[0] : `${overview.overdue.clients.length} clientes`)
              : 'Ninguém em atraso')}
          </div>
        </Card>
      </Row>

      <Row>
        {/* 2. Para fazer hoje */}
        <Card aria-labelledby="hoje" style={{ flexBasis: 420 }}>
          <h2 id="hoje">Para fazer hoje</h2>
          {overview && overview.todo.length === 0 && (
            <p style={{ margin: '12px 0 0', color: '#166534', fontWeight: 600 }}>Nada pendente por aqui. Bom trabalho!</p>
          )}
          <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0 }}>
            {overview?.todo.map((item) => (
              <li key={item.kind} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #f1f5f9' }}>
                <StatusChip tone={TODO_TONE[item.kind][0]}>{TODO_TONE[item.kind][1]}</StatusChip>
                <span style={{ flex: '1 1 180px', minWidth: 0 }}>{item.text}</span>
                <Link to={item.link} style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>{TODO_ACTION[item.kind]}</Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* 3. Fechamento do mês */}
        <Card aria-labelledby="fech" style={{ flexBasis: 320 }}>
          <h2 id="fech">Fechamento de {monthName}</h2>
          {overview && (
            <dl style={{ margin: '10px 0 0', fontSize: 15 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', padding: '7px 0' }}><dt>Recebido</dt><span aria-hidden="true" style={{ flex: 1, borderBottom: '2px dotted #cbd5e1', margin: '0 8px' }} /><dd style={{ margin: 0 }}><Money>{formatCurrency(overview.closing.received)}</Money></dd></div>
              <div style={{ display: 'flex', alignItems: 'baseline', padding: '7px 0' }}><dt>(−) Despesas pagas</dt><span aria-hidden="true" style={{ flex: 1, borderBottom: '2px dotted #cbd5e1', margin: '0 8px' }} /><dd style={{ margin: 0, color: '#b91c1c' }}><Money>{formatCurrency(overview.closing.expensesPaid)}</Money></dd></div>
              <div style={{ display: 'flex', alignItems: 'baseline', padding: '9px 0 2px', fontWeight: 700, fontSize: 17 }}><dt>Resultado</dt><span aria-hidden="true" style={{ flex: 1, borderBottom: '2px dotted #cbd5e1', margin: '0 8px' }} /><dd style={{ margin: 0, borderBottom: '4px double #0f172a', paddingBottom: 1, color: overview.closing.result < 0 ? '#b91c1c' : '#0f172a' }}><Money>{formatCurrency(overview.closing.result)}</Money></dd></div>
            </dl>
          )}
          <Link to="/app/servicos" style={{ display: 'inline-block', marginTop: 14, fontWeight: 600, fontSize: 14 }}>Ver DRE completo</Link>
        </Card>
      </Row>

      {/* 4. Mapa da competência (resumo) */}
      <Card $flush aria-labelledby="mapa" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '16px 20px 8px' }}>
          <div>
            <h2 id="mapa">Competência de {competenceLabel}</h2>
            {comp && <Muted>{competenceSummaryText(comp.summary)}</Muted>}
          </div>
          <Link to="/app/competencia" style={{ fontWeight: 600, fontSize: 14 }}>Abrir o mapa completo</Link>
        </div>
        {comp && <CompetenceTable data={comp} limit={6} />}
      </Card>
    </Page>
  );
}
