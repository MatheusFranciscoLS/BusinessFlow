import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Plus, Edit, Trash2, 
  Search, FileText, ChevronLeft, ChevronRight, Paperclip, Download,
  CheckCircle, Clock, CalendarClock, AlertTriangle, CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; 
import {
    Container, Header, SummaryContainer, SummaryCard, TableContainer, Table,
    ModalOverlay, ModalContent, FormGroup, TransactionTypeContainer, RadioBox, ModalActions, ActionButton,
    SearchContainer, ButtonGroup, FilterPillsContainer, FilterPill, MonthNavigator
} from './styles';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; }`;
const SkeletonRow = styled.div`
  height: 60px; width: 100%; border-radius: 8px; margin-bottom: 12px;
  background: #f0f0f0; background-image: linear-gradient(90deg, #f0f0f0 0px, #fafafa 150px, #f0f0f0 300px);
  background-size: 1000px 100%; animation: ${shimmer} 2s infinite linear;
`;

const MONTHS_BR = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Financial() {
    const { user, selectedCompany } = useAuth(); 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [showAllTime, setShowAllTime] = useState(false); 

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todos');

    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState('income');
    const [date, setDate] = useState('');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('PAGO');
    const [paymentMethod, setPaymentMethod] = useState(''); 

    const queryString = showAllTime ? '' : `?month=${currentMonth}&year=${currentYear}`;
    const { data: transactions, error, mutate } = useSWR(`/transactions${queryString}`, fetcher);

    const categories = useMemo(() => {
        if (!transactions) return ['Todos'];
        const uniqueCats = [...new Set(transactions.map(t => t.category).filter(Boolean))];
        return ['Todos', ...uniqueCats];
    }, [transactions]);

    function handlePreviousMonth() {
        if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); } 
        else { setCurrentMonth(m => m - 1); }
    }
    function handleNextMonth() {
        if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); } 
        else { setCurrentMonth(m => m + 1); }
    }

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(t => {
            const titleMatch = t.title ? t.title.toLowerCase().includes(searchTerm.toLowerCase()) : false;
            const descMatch = t.description ? t.description.toLowerCase().includes(searchTerm.toLowerCase()) : false;
            const matchesSearch = searchTerm === '' || titleMatch || descMatch;
            const matchesCategory = filterCategory === 'Todos' || t.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [transactions, searchTerm, filterCategory]);

    const filteredSummary = useMemo(() => {
        return filteredTransactions.reduce((acc, transaction) => {
            const amount = transaction.amount || transaction.price || 0;
            if (transaction.status === 'PAGO') {
                if (transaction.type === 'income' || transaction.type === 'entrada') {
                    acc.entradas += amount; acc.total += amount;
                } else {
                    acc.saidas += amount; acc.total -= amount;
                }
            }
            return acc;
        }, { entradas: 0, saidas: 0, total: 0 });
    }, [filteredTransactions]);

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    }
    function formatDateDisplay(dateString) {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
    }

    function handleExportPDF() {
        if (!transactions) return;
        const doc = new jsPDF();
        
        const primaryColor = [49, 130, 206];
        const darkColor = [26, 32, 44];
        const brandingName = user?.agencyName || user?.name || "Consultoria Financeira";

        doc.setFillColor(...darkColor);
        doc.rect(0, 0, 210, 42, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22); doc.setFont("helvetica", "bold");
        doc.text(brandingName, 14, 20); 
        
        doc.setFontSize(11); doc.setFont("helvetica", "normal");
        const clientName = selectedCompany?.name || 'Cliente';
        doc.text(`Relatório de Desempenho Financeiro: ${clientName}`, 14, 28);
        const reportPeriod = showAllTime ? "Todo o Histórico" : `${MONTHS_BR[currentMonth - 1]} de ${currentYear}`;
        doc.text(`Período analisado: ${reportPeriod}`, 14, 34);

        doc.setTextColor(...darkColor); doc.setFontSize(14); doc.setFont("helvetica", "bold");
        doc.text("Resumo do Caixa (Realizado)", 14, 55);

        doc.setFontSize(11); doc.setFont("helvetica", "normal");
        doc.text(`Entradas Totais: ${formatCurrency(filteredSummary.entradas)}`, 14, 63);
        doc.text(`Saídas Totais: ${formatCurrency(filteredSummary.saidas)}`, 80, 63);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...(filteredSummary.total >= 0 ? [18, 164, 84] : [229, 46, 77]));
        doc.text(`Saldo Líquido: ${formatCurrency(filteredSummary.total)}`, 145, 63);

        doc.setDrawColor(226, 232, 240); doc.line(14, 68, 196, 68);

        const tableRows = filteredTransactions.map(t => {
            const amount = t.amount || t.price || 0;
            const isIncome = t.type === 'income' || t.type === 'entrada';
            return [
                formatDateDisplay(t.date), 
                t.title || t.description, 
                t.category || 'Geral', 
                t.paymentMethod || '-', 
                `${isIncome ? '+' : '-'} ${formatCurrency(amount)}`,
                t.status || 'PAGO' 
            ];
        });

        autoTable(doc, { 
            head: [["Data", "Descrição", "Categoria", "Forma", "Valor", "Situação"]], 
            body: tableRows, 
            startY: 75, theme: 'grid', 
            headStyles: { fillColor: primaryColor, fontSize: 10 },
            styles: { fontSize: 9, textColor: [74, 85, 104] },
            alternateRowStyles: { fillColor: [247, 250, 252] }
        });

        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160, 174, 192); doc.setFont("helvetica", "normal");
            doc.text(`Documento gerado por ${brandingName} em ${new Date().toLocaleString('pt-BR')}`, 14, 290);
            doc.text(`Página ${i} de ${pageCount}`, 185, 290);
        }

        doc.save(`Relatorio_Financeiro_${clientName.replace(/\s/g, '_')}.pdf`); 
        toast.success("PDF Timbrado exportado com sucesso!");
    }

    function handleOpenNew() {
        setEditingId(null); setTitle(''); setPrice(''); setCategory(''); setType('income'); setDate(''); setFile(null); 
        setStatus('PAGO'); setPaymentMethod(''); 
        setIsModalOpen(true);
    }

    function handleEdit(t) {
        setEditingId(t.id); setTitle(t.title || t.description); setPrice(t.amount || t.price || 0); setCategory(t.category || '');
        setType(t.type === 'entrada' ? 'income' : t.type === 'saida' ? 'outcome' : t.type);
        setDate(t.date ? new Date(t.date).toISOString().split('T')[0] : '');
        setStatus(t.status || 'PAGO'); setPaymentMethod(t.paymentMethod || ''); 
        setFile(null); 
        setIsModalOpen(true);
    }

    async function handleDelete(id) {
        if (window.confirm("Excluir esta transação?")) {
            try { await api.delete(`/transactions/${id}`); mutate(); toast.success("Removido!"); } 
            catch { toast.error("Erro ao eliminar transação."); }
        }
    }

    async function handleMarkAsPaid(t) {
        if (!window.confirm(`Baixar esta conta? O valor entrará no Dashboard.`)) return;
        const toastId = toast.loading('A processar baixa...');
        try {
            const formData = new FormData();
            formData.append('title', t.title || t.description);
            formData.append('description', t.description || t.title);
            formData.append('amount', t.amount || t.price);
            formData.append('category', t.category);
            formData.append('type', t.type);
            formData.append('date', new Date(t.date).toISOString());
            formData.append('status', 'PAGO'); 
            if(t.paymentMethod) formData.append('paymentMethod', t.paymentMethod); 

            await api.put(`/transactions/${t.id}`, formData);
            mutate(); toast.success("Baixa realizada com sucesso!", { id: toastId });
        } catch { toast.error("Erro ao dar baixa.", { id: toastId }); }
    }

    async function handleSave(e) {
        e.preventDefault();
        const toastId = toast.loading('A guardar transação...');
        try {
            const apiType = type === 'income' ? 'entrada' : 'saida';
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', title);
            formData.append('amount', price);
            formData.append('category', category);
            formData.append('type', apiType);
            formData.append('date', new Date(date).toISOString());
            formData.append('status', status); 
            formData.append('paymentMethod', paymentMethod); 
            if (file) formData.append('file', file);

            if (editingId) await api.put(`/transactions/${editingId}`, formData);
            else await api.post('/transactions', formData);
            
            setIsModalOpen(false); mutate(); toast.success("Sucesso!", { id: toastId });
        } catch { toast.error("Erro ao salvar dados.", { id: toastId }); }
    }

    function openAttachment(fileUrl) {
      window.open(`${api.defaults.baseURL.replace('/api', '')}${fileUrl}`, '_blank');
    }

    if (error) return <div style={{ padding: 40, color: 'red' }}>Erro ao carregar dados financeiros.</div>;

    const renderStatusBadge = (statusValue) => {
      switch(statusValue) {
        case 'PAGO': return <span style={{ background: '#C6F6D5', color: '#22543D', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> PAGO</span>;
        case 'PENDENTE': return <span style={{ background: '#FEFCBF', color: '#B7791F', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> PENDENTE</span>;
        case 'AGENDADO': return <span style={{ background: '#EBF8FF', color: '#2B6CB0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CalendarClock size={12} /> AGENDADO</span>;
        case 'ATRASADO': return <span style={{ background: '#FED7D7', color: '#9B2C2C', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> ATRASADO</span>;
        default: return <span style={{ background: '#EDF2F7', color: '#4A5568', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>{statusValue}</span>;
      }
    };

    return (
        <Container>
            <Header style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                    <h1 style={{ margin: 0, fontSize: 26, color: '#1a202c', fontWeight: 800 }}>Financeiro</h1>
                    <ButtonGroup>
                        <button className="secondary" onClick={handleExportPDF} disabled={!transactions}><FileText size={18} /> Relatório PDF</button>
                        <button className="primary" onClick={handleOpenNew} disabled={!transactions}><Plus size={20} /> Nova Transação</button>
                    </ButtonGroup>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', width: '100%', marginBottom: 16 }}>
                    <SearchContainer style={{ flex: '1 1 250px', maxWidth: 'none', margin: 0 }}>
                        <Search size={20} color="#a0aec0" />
                        <input placeholder="Buscar por descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!transactions} />
                    </SearchContainer>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <MonthNavigator style={{ opacity: showAllTime ? 0.4 : 1, pointerEvents: showAllTime ? 'none' : 'auto', margin: 0 }}>
                            <button onClick={handlePreviousMonth}><ChevronLeft size={20} /></button>
                            <span>{MONTHS_BR[currentMonth - 1]} de {currentYear}</span>
                            <button onClick={handleNextMonth}><ChevronRight size={20} /></button>
                        </MonthNavigator>

                        <button onClick={() => setShowAllTime(!showAllTime)} style={{ height: 48, padding: '0 16px', borderRadius: 8, border: '1px solid', background: showAllTime ? '#ebf8ff' : 'white', color: showAllTime ? '#3182ce' : '#718096', borderColor: showAllTime ? '#3182ce' : '#e2e8f0', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                            {showAllTime ? 'Filtrar por Mês' : 'Todo o Histórico'}
                        </button>
                    </div>
                </div>

                <FilterPillsContainer>
                    {categories.map(cat => (
                        <FilterPill key={cat} $active={filterCategory === cat} onClick={() => setFilterCategory(cat)}>{cat}</FilterPill>
                    ))}
                </FilterPillsContainer>
            </Header>

            {!transactions ? (
                <>
                   <SummaryContainer><SkeletonRow style={{ height: 120 }} /><SkeletonRow style={{ height: 120 }} /><SkeletonRow style={{ height: 120 }} /></SummaryContainer>
                   <TableContainer style={{ padding: 24 }}><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></TableContainer>
                </>
            ) : (
                <>
                    <SummaryContainer>
                        <SummaryCard>
                            <header><span>Entradas (Realizado)</span><ArrowUpCircle size={24} color="#12a454" /></header>
                            <strong style={{ color: '#12a454' }}>{formatCurrency(filteredSummary.entradas)}</strong>
                        </SummaryCard>
                        <SummaryCard>
                            <header><span>Saídas (Realizado)</span><ArrowDownCircle size={24} color="#e52e4d" /></header>
                            <strong style={{ color: '#e52e4d' }}>{formatCurrency(filteredSummary.saidas)}</strong>
                        </SummaryCard>
                        <SummaryCard $highlight={true}>
                            <header><span>Saldo Disponível</span><DollarSign size={24} color="white" /></header>
                            <strong>{formatCurrency(filteredSummary.total)}</strong>
                        </SummaryCard>
                    </SummaryContainer>

                    {filteredTransactions.length === 0 ? (
                        <p style={{textAlign: 'center', marginTop: 40, color: '#a0aec0'}}>Nenhuma movimentação encontrada neste período.</p>
                    ) : (
                        <TableContainer>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Descrição / Conta</th><th>Valor</th><th>Categoria</th><th>Data</th><th>Situação</th><th style={{ textAlign: 'center' }}>Anexo</th><th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map(t => {
                                        const amount = t.amount || t.price || 0;
                                        const isIncome = t.type === 'income' || t.type === 'entrada';
                                        const isNotPaid = t.status !== 'PAGO';
                                        const isClient = user?.role === 'CLIENT'; 
                                        return (
                                            <tr key={t.id} style={{ opacity: isNotPaid ? 0.8 : 1, background: t.status === 'ATRASADO' ? '#fff5f5' : 'transparent' }}>
                                                {/* 🔥 AQUI ESTÁ A CORREÇÃO DOS ÍCONES NA TABELA */}
                                                <td>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {isIncome 
                                                      ? <ArrowUpCircle size={20} color="#12a454" /> 
                                                      : <ArrowDownCircle size={20} color="#e52e4d" />}
                                                    <div style={{ fontWeight: 600, color: '#2D3748' }}>{t.description || t.title}</div>
                                                  </div>
                                                  {t.paymentMethod && <div style={{ fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><CreditCard size={12}/> {t.paymentMethod}</div>}
                                                </td>
                                                <td>
                                                    <span style={{ color: isIncome ? '#12a454' : '#e52e4d', fontWeight: 'bold', display: 'block' }}>
                                                        {!isIncome && '- '} {formatCurrency(amount)}
                                                    </span>
                                                </td>
                                                <td><span style={{ background: '#EDF2F7', color: '#2D3748', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{t.category || 'GERAL'}</span></td>
                                                <td>{formatDateDisplay(t.date)}</td>
                                                
                                                <td>{renderStatusBadge(t.status || 'PAGO')}</td>
                                                
                                                <td style={{ textAlign: 'center' }}>
                                                  {t.fileUrl ? (
                                                    <button onClick={() => openAttachment(t.fileUrl)} title="Ver Documento" style={{ background: '#ebf8ff', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#3182ce', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Paperclip size={18} /></button>
                                                  ) : (
                                                    <span style={{ color: '#cbd5e0', fontSize: 12 }}>-</span>
                                                  )}
                                                </td>

<td style={{ textAlign: 'right' }}>
    {/* 🔥 LÓGICA DE SEGURANÇA: Só mostra o botão se não estiver pago E se NÃO for cliente */}
    {isNotPaid && !isClient && (
        <ActionButton 
            onClick={() => handleMarkAsPaid(t)} 
            color="#12a454" 
            title="Dar Baixa (Pagar/Receber)" 
            style={{ marginRight: 8 }}
        >
            <CheckCircle size={18} />
        </ActionButton>
    )}
    
    <ActionButton 
        onClick={() => handleEdit(t)} 
        color="#3182ce" 
        title="Editar"
    >
        <Edit size={18} />
    </ActionButton>
    
    <ActionButton 
        onClick={() => handleDelete(t.id)} 
        color="#e53e3e" 
        title="Excluir"
    >
        <Trash2 size={18} />
    </ActionButton>
</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}

            {isModalOpen && (
                <ModalOverlay>
                    <ModalContent style={{ maxWidth: 650 }}>
                        <h2 style={{ marginBottom: 20 }}>{editingId ? 'Editar' : 'Novo Lançamento'} Financeiro</h2>
                        <form onSubmit={handleSave}>
                            
                            <TransactionTypeContainer style={{ marginBottom: 24 }}>
                                <RadioBox type="button" onClick={() => setType('income')} $isActive={type === 'income' || type === 'entrada'} $activeColor="green">
                                    <ArrowUpCircle size={24} color="#12a454" /> <span>Entrada de Receita</span>
                                </RadioBox>
                                <RadioBox type="button" onClick={() => setType('outcome')} $isActive={type === 'outcome' || type === 'saida'} $activeColor="red">
                                    <ArrowDownCircle size={24} color="#e52e4d" /> <span>Saída / Despesa</span>
                                </RadioBox>
                            </TransactionTypeContainer>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                              <FormGroup><label>Descrição do Lançamento</label><input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ex: Mensalidade Cliente X" /></FormGroup>
                              <FormGroup><label>Valor (R$)</label><input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required /></FormGroup>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              <FormGroup>
                                  <label>Categoria (Plano de Contas)</label>
                                  <select value={category} onChange={e => setCategory(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                      <option value="">Selecione a conta...</option>
                                      {(type === 'income' || type === 'entrada') ? (
                                        <optgroup label="RECEITAS (Entradas)">
                                          <option value="Prestação de Serviços">Prestação de Serviços</option>
                                          <option value="Venda de Produtos">Venda de Produtos</option>
                                          <option value="Rendimentos">Rendimentos / Juros</option>
                                          <option value="Aporte de Sócio">Aporte de Capital (Sócio)</option>
                                          <option value="Outras Receitas">Outras Receitas</option>
                                        </optgroup>
                                      ) : (
                                        <>
                                          <optgroup label="CUSTOS COM PESSOAL">
                                            <option value="Folha de Pagamento">Folha de Pagamento</option>
                                            <option value="Pró-labore">Pró-labore (Sócios)</option>
                                            <option value="Encargos (INSS/FGTS)">Encargos Trabalhistas</option>
                                            <option value="Benefícios">Benefícios (VR/VT)</option>
                                          </optgroup>
                                          <optgroup label="IMPOSTOS E TAXAS">
                                            <option value="Simples Nacional">Simples Nacional (DAS)</option>
                                            <option value="Impostos Federais">Impostos Federais</option>
                                            <option value="Impostos Municipais">Impostos Municipais</option>
                                            <option value="Taxas Bancárias">Taxas Bancárias</option>
                                          </optgroup>
                                          <optgroup label="DESPESAS OPERACIONAIS">
                                            <option value="Honorários Contábeis">Honorários Contábeis</option>
                                            <option value="Aluguel e Condomínio">Aluguel e Condomínio</option>
                                            <option value="Infraestrutura">Infraestrutura (Água/Luz/Internet)</option>
                                            <option value="Software">Softwares e Assinaturas</option>
                                          </optgroup>
                                          <optgroup label="OUTROS">
                                            <option value="Distribuição de Lucros">Distribuição de Lucros</option>
                                            <option value="Outras Despesas">Outras Despesas</option>
                                          </optgroup>
                                        </>
                                      )}
                                  </select>
                              </FormGroup>
                              <FormGroup><label>Data de Competência/Vencimento</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></FormGroup>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              <FormGroup>
                                  <label>Situação do Pagamento</label>
                                  <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                      <option value="PAGO">✅ Realizado (Já na conta)</option>
                                      <option value="PENDENTE">⏳ Pendente (A vencer)</option>
                                      <option value="AGENDADO">📅 Agendado no Banco</option>
                                      <option value="ATRASADO">⚠️ Atrasado (Inadimplente)</option>
                                  </select>
                              </FormGroup>

                              <FormGroup>
                                  <label>Meio de Pagamento</label>
                                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                      <option value="">Não informado</option>
                                      <option value="PIX">PIX</option>
                                      <option value="Boleto Bancário">Boleto Bancário</option>
                                      <option value="TED/DOC">Transferência (TED/DOC)</option>
                                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                                      <option value="Dinheiro Físico">Dinheiro Físico</option>
                                  </select>
                              </FormGroup>
                            </div>

                            <FormGroup style={{ marginTop: 8 }}>
                              <label>Comprovativo / Nota Fiscal</label>
                              <div style={{ border: '1px dashed #cbd5e0', padding: '16px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', position: 'relative', background: '#f7fafc' }}>
                                <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*,application/pdf" style={{ opacity: 0, position: 'absolute', top:0, left:0, width:'100%', height:'100%', cursor:'pointer' }} />
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color: '#4a5568' }}>
                                  <Download size={20} style={{ marginBottom: 8, color: '#3182ce' }} />
                                  <span style={{ fontSize: 13, fontWeight: 600 }}>{file ? file.name : "Clique para anexar PDF ou Imagem"}</span>
                                </div>
                              </div>
                            </FormGroup>

                            <ModalActions>
                                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="save">Confirmar Lançamento</button>
                            </ModalActions>
                        </form>
                    </ModalContent>
                </ModalOverlay>
            )}
        </Container>
    );
}