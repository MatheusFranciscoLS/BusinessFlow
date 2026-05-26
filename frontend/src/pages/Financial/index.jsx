import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Plus, Edit, Trash2, 
  Search, FileText, ChevronLeft, ChevronRight, Paperclip, Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; // 🔥 O Cérebro importado!
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

const MONTHS_BR = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Financial() {
    // 🔥 Puxamos os dados da Consultoria e do Cliente
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
            if (transaction.type === 'income' || transaction.type === 'entrada') {
                acc.entradas += amount; acc.total += amount;
            } else {
                acc.saidas += amount; acc.total -= amount;
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

    // 🔥 O NOVO GERADOR DE PDF DE NÍVEL ENTERPRISE 🔥
    function handleExportPDF() {
        if (!transactions) return;
        const doc = new jsPDF();
        
        // Cores da Marca
        const primaryColor = [49, 130, 206]; // Azul BusinessFlow
        const darkColor = [26, 32, 44]; // Cinza Escuro

        // 1. Cabeçalho Timbrado (Fundo Escuro)
        doc.setFillColor(...darkColor);
        doc.rect(0, 0, 210, 42, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(user?.name || "Consultoria Financeira", 14, 20); // Nome da SUA agência
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const clientName = selectedCompany?.name || 'Cliente';
        doc.text(`Relatório de Desempenho Financeiro: ${clientName}`, 14, 28);
        
        const reportPeriod = showAllTime ? "Todo o Histórico" : `${MONTHS_BR[currentMonth - 1]} de ${currentYear}`;
        doc.text(`Período analisado: ${reportPeriod}`, 14, 34);

        // 2. Resumo Executivo (Mini Cartões)
        doc.setTextColor(...darkColor);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Resumo do Período", 14, 55);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Entradas Totais: ${formatCurrency(filteredSummary.entradas)}`, 14, 63);
        doc.text(`Saídas Totais: ${formatCurrency(filteredSummary.saidas)}`, 80, 63);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...(filteredSummary.total >= 0 ? [18, 164, 84] : [229, 46, 77])); // Verde ou Vermelho
        doc.text(`Saldo Líquido: ${formatCurrency(filteredSummary.total)}`, 145, 63);

        // Linha Divisória
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 68, 196, 68);

        // 3. Tabela Profissional
        const tableRows = filteredTransactions.map(t => {
            const amount = t.amount || t.price || 0;
            const isIncome = t.type === 'income' || t.type === 'entrada';
            return [
                formatDateDisplay(t.date), 
                t.title || t.description, 
                t.category || 'Geral', 
                isIncome ? 'Entrada' : 'Saída', 
                `${isIncome ? '+' : '-'} ${formatCurrency(amount)}`
            ];
        });

        autoTable(doc, { 
            head: [["Data", "Descrição", "Categoria", "Tipo", "Valor"]], 
            body: tableRows, 
            startY: 75, 
            theme: 'grid', 
            headStyles: { fillColor: primaryColor, fontSize: 10 },
            styles: { fontSize: 9, textColor: [74, 85, 104] },
            alternateRowStyles: { fillColor: [247, 250, 252] }
        });

        // 4. Rodapé Automático nas Páginas
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(160, 174, 192);
            doc.setFont("helvetica", "normal");
            doc.text(`Documento gerado por ${user?.name || 'Sistema'} em ${new Date().toLocaleString('pt-BR')}`, 14, 290);
            doc.text(`Página ${i} de ${pageCount}`, 185, 290);
        }

        doc.save(`Relatorio_Financeiro_${clientName.replace(/\s/g, '_')}.pdf`); 
        toast.success("PDF Timbrado exportado com sucesso!");
    }

    function handleOpenNew() {
        setEditingId(null); setTitle(''); setPrice(''); setCategory(''); setType('income'); setDate(''); setFile(null);
        setIsModalOpen(true);
    }

    function handleEdit(t) {
        setEditingId(t.id); setTitle(t.title || t.description); setPrice(t.amount || t.price || 0); setCategory(t.category || '');
        setType(t.type === 'entrada' ? 'income' : t.type === 'saida' ? 'outcome' : t.type);
        setDate(t.date ? new Date(t.date).toISOString().split('T')[0] : '');
        setFile(null); 
        setIsModalOpen(true);
    }

    async function handleDelete(id) {
        if (window.confirm("Excluir esta transação?")) {
            try {
                await api.delete(`/transactions/${id}`);
                mutate(); 
                toast.success("Removido!");
            } catch { toast.error("Erro ao eliminar transação."); }
        }
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
            if (file) formData.append('file', file);

            if (editingId) await api.put(`/transactions/${editingId}`, formData);
            else await api.post('/transactions', formData);
            
            setIsModalOpen(false);
            mutate(); 
            toast.success("Sucesso!", { id: toastId });
        } catch { toast.error("Erro ao salvar dados.", { id: toastId }); }
    }

    function openAttachment(fileUrl) {
      const fullUrl = `${api.defaults.baseURL.replace('/api', '')}${fileUrl}`;
      window.open(fullUrl, '_blank');
    }

    if (error) return <div style={{ padding: 40, color: 'red' }}>Erro ao carregar dados financeiros.</div>;

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
                        <FilterPill key={cat} $active={filterCategory === cat} onClick={() => setFilterCategory(cat)}>
                            {cat}
                        </FilterPill>
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
                            <header><span>Entradas</span><ArrowUpCircle size={24} color="#12a454" /></header>
                            <strong style={{ color: '#12a454' }}>{formatCurrency(filteredSummary.entradas)}</strong>
                        </SummaryCard>
                        <SummaryCard>
                            <header><span>Saídas</span><ArrowDownCircle size={24} color="#e52e4d" /></header>
                            <strong style={{ color: '#e52e4d' }}>{formatCurrency(filteredSummary.saidas)}</strong>
                        </SummaryCard>
                        <SummaryCard $highlight={true}>
                            <header><span>Saldo Período</span><DollarSign size={24} color="white" /></header>
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
                                        <th>Título</th><th>Valor</th><th>Categoria</th><th>Data</th><th style={{ textAlign: 'center' }}>Anexo</th><th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map(t => {
                                        const amount = t.amount || t.price || 0;
                                        const isIncome = t.type === 'income' || t.type === 'entrada';
                                        return (
                                            <tr key={t.id}>
                                                <td>{t.description || t.title}</td>
                                                <td>
                                                    <span style={{ color: isIncome ? '#12a454' : '#e52e4d', fontWeight: 'bold', display: 'block' }}>
                                                        {!isIncome && '- '} {formatCurrency(amount)}
                                                    </span>
                                                </td>
                                                <td><span style={{ background: '#EDF2F7', color: '#2D3748', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{t.category || 'GERAL'}</span></td>
                                                <td>{formatDateDisplay(t.date)}</td>
                                                
                                                <td style={{ textAlign: 'center' }}>
                                                  {t.fileUrl ? (
                                                    <button onClick={() => openAttachment(t.fileUrl)} title="Ver Documento" style={{ background: '#ebf8ff', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#3182ce', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                      <Paperclip size={18} />
                                                    </button>
                                                  ) : (
                                                    <span style={{ color: '#cbd5e0', fontSize: 12 }}>-</span>
                                                  )}
                                                </td>

                                                <td style={{ textAlign: 'right' }}>
                                                    <ActionButton onClick={() => handleEdit(t)} color="#3182ce"><Edit size={18} /></ActionButton>
                                                    <ActionButton onClick={() => handleDelete(t.id)} color="#e53e3e"><Trash2 size={18} /></ActionButton>
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
                    <ModalContent>
                        <h2>{editingId ? 'Editar' : 'Nova'} Transação</h2>
                        <form onSubmit={handleSave}>
                            <FormGroup><label>Título</label><input value={title} onChange={e => setTitle(e.target.value)} required /></FormGroup>
                            <FormGroup><label>Valor (R$)</label><input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required /></FormGroup>

                            <TransactionTypeContainer>
                                <RadioBox type="button" onClick={() => setType('income')} $isActive={type === 'income' || type === 'entrada'} $activeColor="green">
                                    <ArrowUpCircle size={24} color="#12a454" /> <span>Entrada</span>
                                </RadioBox>
                                <RadioBox type="button" onClick={() => setType('outcome')} $isActive={type === 'outcome' || type === 'saida'} $activeColor="red">
                                    <ArrowDownCircle size={24} color="#e52e4d" /> <span>Saída</span>
                                </RadioBox>
                            </TransactionTypeContainer>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              <FormGroup>
                                  <label>Categoria</label>
                                  <select value={category} onChange={e => setCategory(e.target.value)} required>
                                      <option value="">Selecione...</option>
                                      <option value="Serviço">Serviço Prestado</option>
                                      <option value="Pró-labore">Pró-labore (Sócio)</option>
                                      <option value="Folha">Folha de Pagamento</option>
                                      <option value="Impostos">Impostos (FGTS/INSS/DAS)</option>
                                      <option value="Fixo">Despesas Fixas</option>
                                      <option value="Infraestrutura">Infraestrutura</option>
                                      <option value="Outros">Outros</option>
                                  </select>
                              </FormGroup>
                              <FormGroup><label>Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></FormGroup>
                            </div>

                            <FormGroup style={{ marginTop: 16 }}>
                              <label>Comprovativo / Nota Fiscal</label>
                              <div style={{ border: '1px dashed #cbd5e0', padding: '16px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', position: 'relative', background: '#f7fafc' }}>
                                <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*,application/pdf" style={{ opacity: 0, position: 'absolute', top:0, left:0, width:'100%', height:'100%', cursor:'pointer' }} />
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color: '#4a5568' }}>
                                  <Download size={20} style={{ marginBottom: 8, color: '#3182ce' }} />
                                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                                    {file ? file.name : "Clique para anexar PDF ou Imagem"}
                                  </span>
                                </div>
                              </div>
                            </FormGroup>

                            <ModalActions>
                                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="save">Salvar Transação</button>
                            </ModalActions>
                        </form>
                    </ModalContent>
                </ModalOverlay>
            )}
        </Container>
    );
}