import useSWR from 'swr'; 
import React, { useState } from 'react';
import api from '../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  DollarSign, ArrowUpCircle, ArrowDownCircle, Trophy, TrendingUp, TrendingDown, AlertTriangle 
} from 'lucide-react';
import { Container, Header, CardsContainer, Card, ChartContainer, ChartsRow, BottomRow } from './styles';
import styled, { keyframes } from "styled-components";

// Animação Skeleton
const shimmer = keyframes`0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; }`;
const SkeletonCard = styled.div`
  height: ${(props) => props.height || "140px"}; width: 100%; border-radius: 8px; background: #f0f0f0;
  background-image: linear-gradient(90deg, #f0f0f0 0px, #fafafa 150px, #f0f0f0 300px);
  background-size: 1000px 100%; animation: ${shimmer} 2s infinite linear;
`;
const SkeletonContainer = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; width: 100%; padding: 20px;`;

// 🔥 NOVO: Estilo para os Filtros de Período
const FilterContainer = styled.div`
  display: flex; gap: 8px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 4px;
  button {
    padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; white-space: nowrap;
    border: 1px solid #e2e8f0; background: white; color: #4a5568;
    &.active { background: #3182ce; color: white; border-color: #3182ce; }
    &:hover:not(.active) { background: #f7fafc; }
  }
  /* Esconde a barra de scroll no Windows/Mac mas permite deslizar no celular */
  &::-webkit-scrollbar { display: none; }
`;

// Paleta de Cores Premium para o Gráfico de Tarte
const PIE_COLORS = ['#3182ce', '#38b2ac', '#ecc94b', '#ed8936', '#9f7aea', '#e53e3e'];

const fetcher = (url) => api.get(url).then((res) => res.data);

export default function Dashboard() {
  // 🔥 NOVO: O Estado que controla a "Máquina do Tempo" do Dashboard
  const [period, setPeriod] = useState('mes'); 

  // 🔥 O SWR agora escuta a variável "period". Se ela mudar, ele refaz a busca e faz cache na hora!
  const { data: summary, error: errorSummary } = useSWR(`/dashboard/summary?period=${period}`, fetcher);
  const { data: rawMonthlyData, error: errorMonthly } = useSWR(`/dashboard/monthly?period=${period}`, fetcher);
  const { data: topClients, error: errorTop } = useSWR(`/dashboard/top-clients?period=${period}`, fetcher);
  const { data: recentTransactions, error: errorRecent } = useSWR(`/dashboard/recent?period=${period}`, fetcher);

  const isLoading = !summary || !rawMonthlyData || !topClients || !recentTransactions;
  const hasError = errorSummary || errorMonthly || errorTop || errorRecent;

  if (hasError) return <div style={{ padding: 40, color: 'red' }}>Erro ao carregar dados.</div>;

  if (isLoading) {
    return (
      <Container>
        <Header>
          <h1>Business Intelligence</h1>
        </Header>
        <FilterContainer>
          <button className="active">A carregar filtros...</button>
        </FilterContainer>
        <SkeletonContainer>
          <SkeletonCard height="140px" /><SkeletonCard height="140px" /><SkeletonCard height="140px" />
          <div style={{ gridColumn: "1 / -1" }}><SkeletonCard height="350px" /></div>
        </SkeletonContainer>
      </Container>
    );
  }

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthlyData = rawMonthlyData.map((item, index) => ({
    name: months[index],
    Entradas: item.entradas,
    Saídas: item.saidas
  }));

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }
  
  const GrowthBadge = ({ value }) => {
    const isPositive = value >= 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, 
                    color: isPositive ? '#12a454' : '#e52e4d', background: isPositive ? '#e6fffa' : '#fff5f5', 
                    padding: '4px 10px', borderRadius: 20 }}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {value}%
      </div>
    );
  };

  function formatPhone(phone) {
    if (!phone) return 'Sem telefone';
    const p = phone.replace(/\D/g, ''); 
    if (p.length === 11) return p.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    if (p.length === 10) return p.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    return phone;
  }

  return (
    <Container>
      <Header>
        <h1>Business Intelligence</h1>
        <p>Análise avançada de crescimento e fluxo de caixa</p>
      </Header>

      {/* 🔥 OS BOTÕES DE FILTRO */}
      <FilterContainer>
        <button className={period === 'hoje' ? 'active' : ''} onClick={() => setPeriod('hoje')}>Hoje</button>
        <button className={period === '7dias' ? 'active' : ''} onClick={() => setPeriod('7dias')}>Últimos 7 Dias</button>
        <button className={period === 'mes' ? 'active' : ''} onClick={() => setPeriod('mes')}>Este Mês</button>
        <button className={period === 'ano' ? 'active' : ''} onClick={() => setPeriod('ano')}>Este Ano</button>
        <button className={period === 'tudo' ? 'active' : ''} onClick={() => setPeriod('tudo')}>Todo o Histórico</button>
      </FilterContainer>

      <CardsContainer>
        <Card>
          <header>
            <span style={{display: 'flex', alignItems: 'center', gap: 8}}>Entradas <GrowthBadge value={summary.growthEntradas} /></span>
            <ArrowUpCircle size={24} color="#12a454" />
          </header>
          <strong>{formatCurrency(summary.entradas)}</strong>
        </Card>
        <Card>
          <header>
            <span style={{display: 'flex', alignItems: 'center', gap: 8}}>Saídas <GrowthBadge value={summary.growthSaidas} /></span>
            <ArrowDownCircle size={24} color="#e52e4d" />
          </header>
          <strong>{formatCurrency(summary.saidas)}</strong>
        </Card>
        <Card $highlight={true}>
          <header>
            <span>Saldo Líquido</span>
            <DollarSign size={24} color="white" />
          </header>
          <strong>{formatCurrency(summary.saldo)}</strong>
        </Card>
      </CardsContainer>

      <ChartsRow>
        <ChartContainer>
          <h3>Fluxo de Caixa Anual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
              <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'transparent'}} />
              <Legend />
              <Bar dataKey="Entradas" fill="#12a454" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saídas" fill="#e52e4d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer>
          <h3>Origem de Receita</h3>
          {summary.distribuicao?.length === 0 ? (
            <p style={{ color: '#718096', marginTop: 10 }}>Nenhuma entrada registada no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={summary.distribuicao} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {summary.distribuicao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </ChartsRow>

      <BottomRow>
        <ChartContainer>
          <h3>Top Clientes (Receita)</h3>
          {topClients.length === 0 ? (
            <p style={{ color: '#718096', marginTop: 10 }}>Nenhum dado no período.</p>
          ) : (
            <ul style={{ listStyle: 'none', marginTop: '16px' }}>
              {topClients.map((item, index) => (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f7fafc', paddingBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#2d3748', fontSize: 14, fontWeight: 600 }}>
                    <div style={{ background: '#ffedd5', padding: '6px', borderRadius: '50%' }}>
                      <Trophy size={16} color="#ed8936" /> 
                    </div>
                    {item.clientName && item.clientName.length > 20 ? item.clientName.substring(0,20)+'...' : item.clientName || 'Cliente'}
                  </span>
                  <strong style={{ color: '#12a454', fontSize: 15 }}>{formatCurrency(item.total)}</strong>
                </li>
              ))}
            </ul>
          )}
        </ChartContainer>

        <ChartContainer style={{ borderLeft: '4px solid #e53e3e' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e53e3e' }}>
            <AlertTriangle size={20} /> Radar de Inadimplência
          </h3>
          {summary.inadimplentes?.length === 0 ? (
            <p style={{ color: '#48bb78', marginTop: 10, fontWeight: 600 }}>Zero clientes em atraso!</p>
          ) : (
            <ul style={{ listStyle: 'none', marginTop: '16px' }}>
              {summary.inadimplentes.map((item, index) => (
                <li key={index} style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px', background: '#fff5f5', padding: '12px', borderRadius: '8px' }}>
                  <strong style={{ color: '#2d3748', fontSize: 14 }}>{item.fullName}</strong>
                  <span style={{ color: '#e53e3e', fontSize: 12, fontWeight: 600 }}>
                    {formatPhone(item.phone)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ChartContainer>
      </BottomRow>

      <ChartContainer>
        <h3>Últimas Movimentações</h3>
        {recentTransactions?.length === 0 ? (
          <p style={{ color: '#718096', marginTop: 10 }}>Nenhuma transação no período.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#a0aec0', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #edf2f7' }}>Descrição</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#a0aec0', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #edf2f7' }}>Categoria</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#a0aec0', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #edf2f7' }}>Data</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: '#a0aec0', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #edf2f7' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t, index) => {
                  const isIncome = t.type === 'entrada' || t.type === 'income';
                  return (
                    <tr key={index} style={{ borderBottom: index !== recentTransactions.length - 1 ? '1px solid #f7fafc' : 'none' }}>
                      <td style={{ padding: '12px 16px', color: '#2d3748', fontSize: 14, fontWeight: 500 }}>{t.description || t.title}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#edf2f7', color: '#4a5568', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                          {t.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#718096', fontSize: 14 }}>
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: isIncome ? '#12a454' : '#e53e3e' }}>
                        {isIncome ? '+ ' : '- '}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartContainer>
    </Container>
  );
}