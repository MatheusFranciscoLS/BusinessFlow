import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Trophy } from 'lucide-react';
import { Container, Header, CardsContainer, Card, ChartContainer } from './styles';

export default function Dashboard() {
  const [summary, setSummary] = useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]); // <--- NOVO ESTADO
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const token = localStorage.getItem('@BusinessFlow:token');
      if (!token) return; 

      try {
        // Adicionamos a chamada para /recent aqui
        const [summaryRes, monthlyRes, topClientsRes, recentRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/monthly'),
          api.get('/dashboard/top-clients'),
          api.get('/dashboard/recent') // <--- NOVA ROTA
        ]);

        setSummary(summaryRes.data);
        
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const formattedChart = monthlyRes.data.map((item, index) => ({
          name: months[index],
          Entradas: item.entradas,
          Saídas: item.saidas
        }));
        setMonthlyData(formattedChart);

        setTopClients(topClientsRes.data);
        setRecentTransactions(recentRes.data); // <--- SALVA NO ESTADO

      } catch (error) {
        if (error.response?.status !== 401) {
           console.error("Erro ao carregar dashboard", error);
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  if (loading) {
    return <Container><h2 style={{marginTop: 20, color: '#4a5568'}}>Carregando indicadores...</h2></Container>;
  }

  return (
    <Container>
      <Header>
        <h1>Dashboard</h1>
        <p>Visão geral de desempenho</p>
      </Header>

      <CardsContainer>
        <Card>
          <header><span>Entradas (Mês)</span><ArrowUpCircle size={24} color="#12a454" /></header>
          <strong>{formatCurrency(summary.entradas)}</strong>
        </Card>
        <Card>
          <header><span>Saídas (Mês)</span><ArrowDownCircle size={24} color="#e52e4d" /></header>
          <strong>{formatCurrency(summary.saidas)}</strong>
        </Card>
        <Card $highlight={summary.saldo >= 0}>
          <header><span>Saldo Mensal</span><DollarSign size={24} color={summary.saldo >= 0 ? '#12a454' : '#e52e4d'} /></header>
          <strong style={{ color: summary.saldo >= 0 ? '#12a454' : '#e52e4d' }}>
            {formatCurrency(summary.saldo)}
          </strong>
        </Card>
      </CardsContainer>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: 24 }}>
        {/* GRÁFICO */}
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

        {/* TOP CLIENTES */}
        <ChartContainer>
          <h3>Top 5 Clientes</h3>
          {topClients.length === 0 ? (
            <p style={{ color: '#718096', marginTop: 10 }}>Nenhum dado ainda.</p>
          ) : (
            <ul style={{ listStyle: 'none', marginTop: '16px' }}>
              {topClients.map((item, index) => (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2d3748', fontSize: 14 }}>
                    <Trophy size={16} color="#ecc94b" /> 
                    {item.clientName && item.clientName.length > 15 ? item.clientName.substring(0,15)+'...' : item.clientName || 'Cliente'}
                  </span>
                  <strong style={{ color: '#2d3748', fontSize: 14 }}>{formatCurrency(item.total)}</strong>
                </li>
              ))}
            </ul>
          )}
        </ChartContainer>
      </div>

      {/* --- NOVA TABELA: ÚLTIMAS MOVIMENTAÇÕES --- */}
      <ChartContainer>
        <h3>Últimas Movimentações</h3>
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: 10, color: '#718096', fontSize: 12 }}>Descrição</th>
                <th style={{ padding: 10, color: '#718096', fontSize: 12 }}>Data</th>
                <th style={{ padding: 10, color: '#718096', fontSize: 12, textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                 <tr><td colSpan="3" style={{ padding: 20, textAlign: 'center', color: '#aaa' }}>Nenhuma movimentação recente.</td></tr>
              ) : (
                recentTransactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f7fafc' }}>
                    <td style={{ padding: 12, color: '#2d3748', fontSize: 14 }}>{t.title}</td>
                    <td style={{ padding: 12, color: '#718096', fontSize: 14 }}>
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', fontSize: 14 }}>
                      <span style={{ color: t.type === 'income' ? '#12a454' : '#e52e4d' }}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ChartContainer>

    </Container>
  );
}