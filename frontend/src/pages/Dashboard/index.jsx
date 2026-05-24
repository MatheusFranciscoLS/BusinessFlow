import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
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

// Paleta de Cores Premium para o Gráfico de Tarte
const PIE_COLORS = ['#3182ce', '#38b2ac', '#ecc94b', '#ed8936', '#9f7aea', '#e53e3e'];

export default function Dashboard() {
  const [summary, setSummary] = useState({ 
    entradas: 0, saidas: 0, saldo: 0, growthEntradas: 0, growthSaidas: 0, 
    distribuicao: [], inadimplentes: [] 
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const token = localStorage.getItem('@BusinessFlow:token');
      if (!token) return; 

      try {
        setLoading(true);
        const [summaryRes, monthlyRes, topClientsRes, recentRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/monthly'),
          api.get('/dashboard/top-clients'),
          api.get('/dashboard/recent') 
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
        setRecentTransactions(recentRes.data); 

      } catch (error) {
        if (error.response?.status !== 401) toast.error("Erro ao carregar dados de BI.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  // Componente de Badge Dinâmico para Crescimento
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

  if (loading) {
    return (
      <SkeletonContainer>
        <SkeletonCard height="140px" /><SkeletonCard height="140px" /><SkeletonCard height="140px" />
        <div style={{ gridColumn: "1 / -1" }}><SkeletonCard height="350px" /></div>
      </SkeletonContainer>
    );
  }

  function formatPhone(phone) {
    if (!phone) return 'Sem telefone';
    const p = phone.replace(/\D/g, ''); // Limpa tudo que não é número
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
          <strong>
            {formatCurrency(summary.saldo)}
          </strong>
        </Card>
      </CardsContainer>

      {/* LINHA 1: FLUXO DE CAIXA E DISTRIBUIÇÃO */}
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
            <p style={{ color: '#718096', marginTop: 10 }}>Nenhuma entrada registada no mês.</p>
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

      {/* LINHA 2: TOP CLIENTES E RADAR DE INADIMPLÊNCIA */}
      <BottomRow>
        
        {/* TOP CLIENTES */}
        <ChartContainer>
          <h3>Top Clientes (Receita)</h3>
          {topClients.length === 0 ? (
            <p style={{ color: '#718096', marginTop: 10 }}>Nenhum dado ainda.</p>
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

        {/* RADAR DE INADIMPLÊNCIA */}
        <ChartContainer style={{ borderLeft: '4px solid #e53e3e' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e53e3e' }}>
            <AlertTriangle size={20} /> Radar de Inadimplência
          </h3>
          {summary.inadimplentes?.length === 0 ? (
            <p style={{ color: '#48bb78', marginTop: 10, fontWeight: 600 }}>Zero clientes em atraso! Excelente!</p>
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
    </Container>
  );
}