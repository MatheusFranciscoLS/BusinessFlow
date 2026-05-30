import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronLeft, ChevronRight, FileText, PieChart, Filter, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Container, Header, DREContainer, DRERow, MonthNavigator } from './styles';

const MONTHS_BR = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const fetcher = (url) => api.get(url).then(res => res.data);

export default function DRE() {
  const { user, selectedCompany } = useAuth();
  const isClient = user?.role === 'CLIENT';
  
  // Identifica a empresa (via acesso do cliente ou seleção do gestor)
  const queryCompany = isClient ? user?.companyAccessId : selectedCompany?.id;

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [clientFilter, setClientFilter] = useState('');

  // 🔥 A MÁGICA: Enviamos os dados para o Back-end. O Interceptor garante que o Cliente só receba as SUAS transações.
  const queryParams = queryCompany 
    ? `?month=${currentMonth}&year=${currentYear}&companyId=${queryCompany}&role=${user?.role}&userEmail=${user?.email}` 
    : null;
    
  const { data: transactions, error } = useSWR(queryParams ? `/transactions${queryParams}` : null, fetcher);
  
  // O Gestor precisa da lista de clientes para a caixa de filtro. O Cliente não (por isso é false).
  const { data: clients } = useSWR(!isClient && queryCompany ? `/clients?companyId=${queryCompany}` : null, fetcher);

  function handlePrev() { if(currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); } else { setCurrentMonth(m => m - 1); } }
  function handleNext() { if(currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); } else { setCurrentMonth(m => m + 1); } }

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  // Calcula a matemática do DRE
const dre = useMemo(() => {
    if (!transactions) return null;
    
    let filteredTransactions = transactions;
    if (!isClient) {
      if (clientFilter === "") {
        // 🔥 Considera apenas a saúde financeira das empresas dos clientes
        filteredTransactions = transactions.filter(t => t.clientId !== null);
      } else if (clientFilter === "INTERNO") {
        // Considera apenas as movimentações da própria agência
        filteredTransactions = transactions.filter(t => t.clientId === null);
      } else {
        filteredTransactions = transactions.filter(t => t.clientId === clientFilter);
      }
    }
    
    const paid = filteredTransactions.filter(t => t.status === 'PAGO');
    let receitas = 0; let impostos = 0; let pessoal = 0; let operacionais = 0; let distribuicao = 0;

    paid.forEach(t => {
      const val = t.amount || t.price || 0;
      if (t.type === 'entrada' || t.type === 'income') receitas += val;
      else {
        const cat = t.category || '';
        if (cat.includes('Simples') || cat.includes('Impostos') || cat.includes('Taxas Bancárias')) impostos += val;
        else if (cat.includes('Folha') || cat.includes('Pró-labore') || cat.includes('Encargos') || cat.includes('Benefícios')) pessoal += val;
        else if (cat.includes('Distribuição de Lucros')) distribuicao += val;
        else operacionais += val; 
      }
    });

    const receitaLiquida = receitas - impostos;
    const lucroOperacional = receitaLiquida - pessoal - operacionais;
    const lucroLiquido = lucroOperacional - distribuicao;

    return { receitas, impostos, receitaLiquida, pessoal, operacionais, lucroOperacional, distribuicao, lucroLiquido };
  }, [transactions, clientFilter, isClient]);

  function exportDRE() {
    if (!dre) return;
    const doc = new jsPDF();
    const brandingName = user?.agencyName || user?.name || "Consultoria Financeira";
    
    let reportSubject = selectedCompany?.name || 'Visão Geral (Agência)';
    if (isClient) reportSubject = user.name;
    else if (clientFilter && clients) {
        const c = clients.find(c => c.id === clientFilter);
        if (c) reportSubject = c.fullName;
    }

    doc.setFillColor(26, 32, 44); doc.rect(0, 0, 210, 42, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold");
    doc.text(brandingName, 14, 20); 
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text(`Demonstrativo de Resultados (DRE): ${reportSubject}`, 14, 28);
    doc.text(`Período: ${MONTHS_BR[currentMonth - 1]} de ${currentYear}`, 14, 34);

    autoTable(doc, {
      startY: 50, theme: 'grid', head: [['Estrutura do DRE', 'Valor Computado (R$)']],
      body: [
        ['(+) RECEITA BRUTA DE VENDAS / SERVIÇOS', formatCurrency(dre.receitas)],
        ['(-) Impostos, Taxas e Deduções', formatCurrency(dre.impostos)],
        ['(=) RECEITA LÍQUIDA', formatCurrency(dre.receitaLiquida)],
        ['(-) Custos com Pessoal e Encargos', formatCurrency(dre.pessoal)],
        ['(-) Despesas Operacionais e Administrativas', formatCurrency(dre.operacionais)],
        ['(=) RESULTADO OPERACIONAL (EBITDA)', formatCurrency(dre.lucroOperacional)],
        ['(-) Distribuição de Lucros aos Sócios', formatCurrency(dre.distribuicao)],
        ['(=) LUCRO / PREJUÍZO LÍQUIDO DO EXERCÍCIO', formatCurrency(dre.lucroLiquido)],
      ],
      headStyles: { fillColor: [49, 130, 206], fontSize: 11 }, styles: { fontSize: 10, textColor: [45, 55, 72] },
      willDrawCell: function(data) { if (data.row.index === 2 || data.row.index === 5 || data.row.index === 7) doc.setFont("helvetica", "bold"); }
    });

    doc.save(`DRE_${reportSubject.replace(/\s/g, '_')}_${MONTHS_BR[currentMonth-1]}.pdf`);
    toast.success("DRE exportado com sucesso!");
  }

  if (error) return <div style={{ padding: 40, color: 'red' }}>Erro ao carregar dados financeiros.</div>;

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
           <PieChart size={32} color="#3182ce" />
           <h1 style={{ margin: 0 }}>Análise de Dados e DRE</h1>
        </div>
        <button onClick={exportDRE} disabled={!dre} style={{ height: 48, padding: '0 20px', borderRadius: 8, background: '#3182ce', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} /> Baixar Relatório (PDF)
        </button>
      </Header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        
        {/* 🔥 BLINDAGEM: O Cliente não vê a caixa de pesquisa de outras empresas */}
{!isClient ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1, minWidth: 280, maxWidth: 400 }}>
        <Filter size={20} color="#718096" />
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: '#2d3748', fontWeight: 700, fontSize: 15, cursor: 'pointer', appearance: 'none' }}>
          <option value="">Consolidado de Clientes (BPO)</option>
          <option value="INTERNO">Caixa Interno do Escritório</option>
          {clients?.map(c => <option key={c.id} value={c.id}>Cliente: {c.fullName}</option>)}
        </select>
        <ChevronDown size={20} color="#a0aec0" style={{ pointerEvents: 'none' }} />
      </div>
    ) : (
      <div style={{ flex: 1, minWidth: 280, maxWidth: 400 }}></div>
    )}

        <MonthNavigator>
          <button onClick={handlePrev}><ChevronLeft size={20} /></button>
          <span style={{ minWidth: 140, textAlign: 'center' }}>{MONTHS_BR[currentMonth - 1]} de {currentYear}</span>
          <button onClick={handleNext}><ChevronRight size={20} /></button>
        </MonthNavigator>
      </div>

      {!dre ? (
        <p style={{ color: '#a0aec0' }}>A calcular métricas...</p>
      ) : (
        <DREContainer>
          <DRERow $isTotal><span>(+) RECEITA BRUTA DE VENDAS E SERVIÇOS</span><span style={{ color: '#12a454' }}>{formatCurrency(dre.receitas)}</span></DRERow>
          <DRERow $indent><span>(-) Impostos, Taxas e Deduções sobre Vendas</span><span style={{ color: '#e53e3e' }}>{formatCurrency(dre.impostos)}</span></DRERow>
          <DRERow $isTotal style={{ background: '#ebf8ff', borderTop: '2px solid #3182ce', borderBottom: '2px solid #3182ce' }}><span>(=) RECEITA LÍQUIDA</span><span style={{ color: '#2b6cb0' }}>{formatCurrency(dre.receitaLiquida)}</span></DRERow>
          <DRERow $indent><span>(-) Custos com Pessoal e Encargos (Folha / Pró-labore)</span><span style={{ color: '#e53e3e' }}>{formatCurrency(dre.pessoal)}</span></DRERow>
          <DRERow $indent><span>(-) Despesas Operacionais e Administrativas</span><span style={{ color: '#e53e3e' }}>{formatCurrency(dre.operacionais)}</span></DRERow>
          <DRERow $isTotal style={{ background: '#edf2f7' }}><span>(=) RESULTADO OPERACIONAL (EBITDA / LAIR)</span><span>{formatCurrency(dre.lucroOperacional)}</span></DRERow>
          <DRERow $indent><span>(-) Distribuição de Lucros aos Sócios</span><span style={{ color: '#e53e3e' }}>{formatCurrency(dre.distribuicao)}</span></DRERow>
          <DRERow $isTotal style={{ background: dre.lucroLiquido >= 0 ? '#f0fff4' : '#fff5f5', borderTop: dre.lucroLiquido >= 0 ? '2px solid #48bb78' : '2px solid #f56565' }}><span style={{ fontSize: 18, color: dre.lucroLiquido >= 0 ? '#22543d' : '#742a2a' }}>(=) LUCRO LÍQUIDO DO EXERCÍCIO</span><span style={{ fontSize: 18, color: dre.lucroLiquido >= 0 ? '#38a169' : '#e53e3e' }}>{formatCurrency(dre.lucroLiquido)}</span></DRERow>
        </DREContainer>
      )}
    </Container>
  );
}