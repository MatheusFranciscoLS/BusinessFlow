import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Plus, Edit, Trash2, Search, FileText } from 'lucide-react';
import {
    Container, Header, SummaryContainer, SummaryCard, TableContainer, Table,
    ModalOverlay, ModalContent, FormGroup, TransactionTypeContainer, RadioBox, ModalActions, ActionButton,
    Toolbar, FilterGroup, SearchContainer, ButtonGroup
} from './styles';

export default function Financial() {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ entradas: 0, saidas: 0, saldo: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // --- FILTROS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [categories, setCategories] = useState([]);

    // --- FORMULÁRIO ---
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState(0);
    const [category, setCategory] = useState('');
    const [type, setType] = useState('income');
    const [date, setDate] = useState('');

    // 1. CARREGAR DADOS
    async function loadTransactions() {
        try {
            const response = await api.get('/transactions');
            const data = response.data;
            setTransactions(data);
            calculateSummary(data);

            const uniqueCats = [...new Set(data.map(t => t.category).filter(Boolean))];
            setCategories(['Todos', ...uniqueCats]);

        } catch (error) {
            console.error("Erro ao carregar financeiro:", error);
            toast.error("Falha ao carregar dados.");
        }
    }

    useEffect(() => { loadTransactions(); }, []);

    // 2. CÁLCULOS E FORMATAÇÃO
    function calculateSummary(data) {
        const sum = data.reduce((acc, transaction) => {
            if (transaction.type === 'income') {
                acc.entradas += transaction.price;
                acc.total += transaction.price;
            } else {
                acc.saidas += transaction.price;
                acc.total -= transaction.price;
            }
            return acc;
        }, { entradas: 0, saidas: 0, total: 0 });
        setSummary(sum);
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    }

    function formatDateDisplay(dateString) {
        if (!dateString) return '-';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // 3. LÓGICA DE FILTRO
    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'Todos' || !filterCategory || t.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Recalcula resumo filtrado
    const filteredSummary = filteredTransactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
            acc.entradas += transaction.price;
            acc.total += transaction.price;
        } else {
            acc.saidas += transaction.price;
            acc.total -= transaction.price;
        }
        return acc;
    }, { entradas: 0, saidas: 0, total: 0 });

    // 4. EXPORTAR PDF
    function handleExportPDF() {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Relatório Financeiro BusinessFlow", 14, 22);
        doc.setFontSize(10);
        doc.text(`Saldo do Período: ${formatCurrency(filteredSummary.total)}`, 14, 28);

        const tableColumn = ["Data", "Título", "Categoria", "Tipo", "Valor (R$)"];
        const tableRows = [];

        filteredTransactions.forEach(t => {
            const value = `${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.price)}`;
            const typeText = t.type === 'income' ? 'Entrada' : 'Saída';
            tableRows.push([formatDateDisplay(t.date), t.title, t.category, typeText, value]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [49, 130, 206] }
        });

        doc.save("financeiro.pdf");
        toast.success("PDF baixado!");
    }

    // --- CRUD ---
    function handleOpenNew() {
        setEditingId(null);
        setTitle(''); setPrice(0); setCategory(''); setType('income'); setDate('');
        setIsModalOpen(true);
    }

    function handleEdit(t) {
        setEditingId(t.id);
        setTitle(t.title);
        setPrice(t.price);
        setCategory(t.category);
        setType(t.type);
        setDate(t.date);
        setIsModalOpen(true);
    }

    async function handleDelete(id) {
        if (window.confirm("Excluir transação?")) {
            try {
                await api.delete(`/transactions/${id}`);
                loadTransactions();
                toast.success("Excluído!");
            } catch { toast.error("Erro ao excluir."); }
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        const payload = { title, price, category, type, date };
        const toastId = toast.loading('Salvando...');

        try {
            if (editingId) {
                await api.put(`/transactions/${editingId}`, payload);
            } else {
                await api.post('/transactions', payload);
            }
            setIsModalOpen(false);
            loadTransactions();
            toast.success("Salvo com sucesso!", { id: toastId });
        } catch {
            toast.error("Erro ao salvar.", { id: toastId });
        }
    }

    return (
        <Container>
            <Header>
                <h1>Financeiro</h1>
                <Toolbar>
                    <FilterGroup>
                        <SearchContainer>
                            <Search size={20} color="#a0aec0" />
                            <input
                                placeholder="Buscar por descrição..."  // <--- Aqui estava aparecendo "null"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </SearchContainer>
                        <SearchContainer style={{ maxWidth: 200 }}>
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </SearchContainer>
                    </FilterGroup>

                    <ButtonGroup>
                        <button className="secondary" onClick={handleExportPDF}><FileText size={18} /> Exportar PDF</button>
                        <button className="primary" onClick={handleOpenNew}><Plus size={20} /> Nova Transação</button>
                    </ButtonGroup>
                </Toolbar>
            </Header>

            <SummaryContainer>
                <SummaryCard>
                    <header><span>Entradas (Filtrado)</span><ArrowUpCircle size={24} color="#12a454" /></header>
                    <strong style={{ color: '#12a454' }}>{formatCurrency(filteredSummary.entradas)}</strong>
                </SummaryCard>
                <SummaryCard>
                    <header><span>Saídas (Filtrado)</span><ArrowDownCircle size={24} color="#e52e4d" /></header>
                    <strong style={{ color: '#e52e4d' }}>{formatCurrency(filteredSummary.saidas)}</strong>
                </SummaryCard>
                <SummaryCard $highlight={filteredSummary.total >= 0}>
                    <header>
                        <span>Total (Filtrado)</span>
                        <DollarSign size={24} color="white" />
                    </header>
                    <strong>{formatCurrency(filteredSummary.total)}</strong>
                </SummaryCard>
            </SummaryContainer>

            <TableContainer>
                <Table>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Valor</th>
                            <th>Categoria</th>
                            <th>Data</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(t => (
                            <tr key={t.id}>
                                <td>{t.title}</td>

                                {/* AQUI ESTÁ A CORREÇÃO DEFINITIVA DA COR */}
                                <td>
                                    <span style={{
                                        color: t.type === 'income' ? '#12a454' : '#e52e4d',
                                        fontWeight: 'bold',
                                        display: 'block'
                                    }}>
                                        {t.type === 'outcome' && '- '}
                                        {formatCurrency(t.price)}
                                    </span>
                                </td>

                                <td>
                                    <span style={{ background: '#EDF2F7', color: '#2D3748', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                                        {t.category || 'GERAL'}
                                    </span>
                                </td>
                                <td>{formatDateDisplay(t.date)}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <ActionButton onClick={() => handleEdit(t)} color="#3182ce"><Edit size={18} /></ActionButton>
                                    <ActionButton onClick={() => handleDelete(t.id)} color="#e53e3e"><Trash2 size={18} /></ActionButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </TableContainer>

            {/* MODAL */}
            {isModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <h2>{editingId ? 'Editar' : 'Nova'} Transação</h2>
                        <form onSubmit={handleSave}>
                            <FormGroup><label>Título</label><input value={title} onChange={e => setTitle(e.target.value)} required /></FormGroup>
                            <FormGroup><label>Valor</label><input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required /></FormGroup>

                            <TransactionTypeContainer>
                                <RadioBox type="button" onClick={() => setType('income')} $isActive={type === 'income'} $activeColor="green">
                                    <ArrowUpCircle size={24} color="#12a454" /> <span>Entrada</span>
                                </RadioBox>
                                <RadioBox type="button" onClick={() => setType('outcome')} $isActive={type === 'outcome'} $activeColor="red">
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