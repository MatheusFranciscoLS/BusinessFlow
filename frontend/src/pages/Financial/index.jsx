import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Plus, Edit, Trash2, 
  Search, FileText, ChevronLeft, ChevronRight 
} from 'lucide-react';
import {
    Container, Header, SummaryContainer, SummaryCard, TableContainer, Table,
    ModalOverlay, ModalContent, FormGroup, TransactionTypeContainer, RadioBox, ModalActions, ActionButton,
    SearchContainer, ButtonGroup, FilterPillsContainer, FilterPill, MonthNavigator
} from './styles';
import styled, { keyframes } from 'styled-components';

// 🔥 Animação Shimmer para os Skeletons
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

// 🔥 Tradutor do SWR
const fetcher = (url) => api.get(url).then(res => res.data);

export default function Financial() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // --- MÁQUINA DO TEMPO ---
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [showAllTime, setShowAllTime] = useState(false); 

    // --- OUTROS FILTROS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todos');

    // --- FORMULÁRIO ---
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState(0);
    const [category, setCategory] = useState('');
    const [type, setType] = useState('income');
    const [date, setDate] = useState('');

    // 🔥 SWR: A query muda dinamicamente quando você troca de mês ou clica em "Todo o Histórico"!
    const queryString = showAllTime ? '' : `?month=${currentMonth}&year=${currentYear}`;
    const { data: transactions, error, mutate } = useSWR(`/transactions${queryString}`, fetcher);

    // Deriva as categorias dinamicamente a partir dos dados em cache
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

    function handleExportPDF() {
        if (!transactions) return;
        const doc = new jsPDF();
        doc.setFontSize(14);
        const reportTitle = showAllTime ? "Relatório Financeiro - Todo o Histórico" : `Relatório Financeiro - ${MONTHS_BR[currentMonth - 1]} / ${currentYear}`;
        doc.text(reportTitle, 14, 22); doc.setFontSize(10);
        doc.text(`Balanço do Período: ${formatCurrency(filteredSummary.total)}`, 14, 28);
        const tableRows = filteredTransactions.map(t => {
            const amount = t.amount || t.price || 0;
            const isIncome = t.type === 'income' || t.type === 'entrada';
            return [formatDateDisplay(t.date), t.title || t.description, t.category || 'Geral', isIncome ? 'Entrada' : 'Saída', `${isIncome ? '+' : '-'} ${formatCurrency(amount)}`];
        });
        autoTable(doc, { head: [["Data", "Título", "Categoria", "Tipo", "Valor"]], body: tableRows, startY: 35, theme: 'grid', headStyles: { fillColor: [49, 130, 206] } });
        doc.save(`financeiro.pdf`); toast.success("PDF gerado!");
    }

    function handleOpenNew() {
        setEditingId(null); setTitle(''); setPrice(0); setCategory(''); setType('income'); setDate('');
        setIsModalOpen(true);
    }

    function handleEdit(t) {
        setEditingId(t.id); setTitle(t.title || t.description); setPrice(t.amount || t.price || 0); setCategory(t.category || '');
        setType(t.type === 'entrada' ? 'income' : t.type === 'saida' ? 'outcome' : t.type);
        setDate(t.date ? new Date(t.date).toISOString().split('T')[0] : '');
        setIsModalOpen(true);
    }

    async function handleDelete(id) {
        if (window.confirm("Excluir esta transação?")) {
            try {
                await api.delete(`/transactions/${id}`);
                mutate(); // 🔥 SWR atualiza instantaneamente
                toast.success("Removido!");
            } catch { toast.error("Erro ao eliminar transação."); }
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        const apiType = type === 'income' ? 'entrada' : 'saida';
        const payload = { title, description: title, amount: parseFloat(price), category, type: apiType, date: new Date(date).toISOString() };
        const toastId = toast.loading('A guardar...');
        try {
            if (editingId) await api.put(`/transactions/${editingId}`, payload);
            else await api.post('/transactions', payload);
            
            setIsModalOpen(false);
            mutate(); // 🔥 Puxa os dados novos na hora
            toast.success("Sucesso!", { id: toastId });
        } catch { toast.error("Erro ao salvar dados.", { id: toastId }); }
    }

    if (error) return <div style={{ padding: 40, color: 'red' }}>Erro ao carregar dados financeiros.</div>;

    return (
        <Container>
            <Header style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                    <h1 style={{ margin: 0, fontSize: 26, color: '#1a202c', fontWeight: 800 }}>Financeiro</h1>
                    <ButtonGroup>
                        <button className="secondary" onClick={handleExportPDF} disabled={!transactions}><FileText size={18} /> Exportar PDF</button>
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

            {/* 🔥 ESTADO DE CARREGAMENTO (SKELETONS) */}
            {!transactions ? (
                <>
                   <SummaryContainer>
                       <SkeletonRow style={{ height: 120 }} /><SkeletonRow style={{ height: 120 }} /><SkeletonRow style={{ height: 120 }} />
                   </SummaryContainer>
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
                                        <th>Título</th><th>Valor</th><th>Categoria</th><th>Data</th><th style={{ textAlign: 'right' }}>Ações</th>
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

            {/* MODAL */}
            {isModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <h2>{editingId ? 'Editar' : 'Nova'} Transação</h2>
                        <form onSubmit={handleSave}>
                            <FormGroup><label>Título</label><input value={title} onChange={e => setTitle(e.target.value)} required /></FormGroup>
                            <FormGroup><label>Valor</label><input type="number" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} required /></FormGroup>

                            <TransactionTypeContainer>
                                <RadioBox type="button" onClick={() => setType('income')} $isActive={type === 'income' || type === 'entrada'} $activeColor="green">
                                    <ArrowUpCircle size={24} color="#12a454" /> <span>Entrada</span>
                                </RadioBox>
                                <RadioBox type="button" onClick={() => setType('outcome')} $isActive={type === 'outcome' || type === 'saida'} $activeColor="red">
                                    <ArrowDownCircle size={24} color="#e52e4d" /> <span>Saída</span>
                                </RadioBox>
                            </TransactionTypeContainer>
                            <FormGroup>
                                <label>Categoria</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} required>
                                    <option value="">Selecione...</option>
                                    <option value="Venda">Venda</option>
                                    <option value="Serviço">Serviço</option>
                                    <option value="Fixo">Despesas Fixas</option>
                                    <option value="Variavel">Despesas Variáveis</option>
                                    <option value="Infraestrutura">Infraestrutura</option>
                                    <option value="Pessoal">Pessoal</option>
                                    <option value="Impostos">Impostos</option>
                                </select>
                            </FormGroup>
                            <FormGroup><label>Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></FormGroup>

                            <ModalActions>
                                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="save">Salvar</button>
                            </ModalActions>
                        </form>
                    </ModalContent>
                </ModalOverlay>
            )}
        </Container>
    );
}