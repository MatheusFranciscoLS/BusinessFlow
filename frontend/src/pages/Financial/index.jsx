import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Plus, Edit, Trash2, 
  Search, FileText, ChevronLeft, ChevronRight, Paperclip,
  CheckCircle, Clock, CalendarClock, AlertTriangle, Repeat, User,
  UploadCloud, Link as LinkIcon, CreditCard, ShieldAlert, Wand2, QrCode
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; 
import {
    Container, Header, SummaryContainer, SummaryCard, TableContainer, Table,
    ModalOverlay, ModalContent, FormGroup, TransactionTypeContainer, RadioBox, ModalActions, ActionButton,
    SearchContainer, ButtonGroup, FilterPillsContainer, FilterPill, MonthNavigator
} from './styles';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; }`;
const SkeletonRow = styled.div`height: 60px; width: 100%; border-radius: 8px; margin-bottom: 12px; background: #f0f0f0; background-image: linear-gradient(90deg, #f0f0f0 0px, #fafafa 150px, #f0f0f0 300px); background-size: 1000px 100%; animation: ${shimmer} 2s infinite linear;`;

const MONTHS_BR = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const fetcher = (url) => api.get(url).then(res => res.data);

export default function Financial() {
    const { user, selectedCompany } = useAuth(); 
    const isClient = user?.role === 'CLIENT';
    const queryCompany = isClient ? user?.companyAccessId : selectedCompany?.id;

    // --- ESTADOS GERAIS ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false); 

    // --- FILTROS ---
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [showAllTime, setShowAllTime] = useState(false); 
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todos');
    const [clientFilter, setClientFilter] = useState(''); 

    // --- ESTADOS DE AÇÕES EM MASSA E PIX ---
    const [selectedIds, setSelectedIds] = useState([]); 
    const [pixTransaction, setPixTransaction] = useState(null); 

    // --- ESTADOS DO FORMULÁRIO ---
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState('income');
    const [date, setDate] = useState('');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('PAGO');
    const [paymentMethod, setPaymentMethod] = useState(''); 
    const [clientId, setClientId] = useState(''); 
    const [isRecurring, setIsRecurring] = useState(false);
    const [installments, setInstallments] = useState(1);

    // --- ESTADOS DA CONCILIAÇÃO OFX ---
    const [isOfxModalOpen, setIsOfxModalOpen] = useState(false);
    const [bankTransactions, setBankTransactions] = useState([]);
    const [selectedBankTx, setSelectedBankTx] = useState(null);
    const [selectedSystemTx, setSelectedSystemTx] = useState(null);
    const [autoMatches, setAutoMatches] = useState([]); 

    const timeQuery = showAllTime ? '' : `&month=${currentMonth}&year=${currentYear}`;
    const queryParams = queryCompany ? `?companyId=${queryCompany}${timeQuery}` : null;
    
    const { data: transactions, error, mutate } = useSWR(queryParams ? `/transactions${queryParams}` : null, fetcher);
    const { data: clients } = useSWR(!isClient && queryCompany ? `/clients?companyId=${queryCompany}` : null, fetcher);

    const myClientRecord = useMemo(() => {
        if (!isClient || !clients) return null;
        return clients.find(c => c.email === user.email);
    }, [isClient, clients, user]);

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
        let filtered = transactions;

        if (!isClient) {
            if (clientFilter === "") {
                filtered = filtered.filter(t => t.clientId !== null); 
            } else if (clientFilter === "INTERNO") {
                filtered = filtered.filter(t => t.clientId === null); 
            } else {
                filtered = filtered.filter(t => t.clientId === clientFilter);
            }
        }

        return filtered.filter(t => {
            const titleMatch = t.title ? t.title.toLowerCase().includes(searchTerm.toLowerCase()) : false;
            const clientMatch = t.client?.fullName ? t.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
            const matchesSearch = searchTerm === '' || titleMatch || clientMatch;
            const matchesCategory = filterCategory === 'Todos' || t.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [transactions, searchTerm, filterCategory, clientFilter, isClient]);

const filteredSummary = useMemo(() => {
        return filteredTransactions.reduce((acc, transaction) => {
            const amount = transaction.amount || transaction.price || 0;
            if (transaction.status === 'PAGO') {
                // Descobre a perspectiva real
                const isFirmIncome = transaction.type === 'income' || transaction.type === 'entrada';
                // 🔥 A MÁGICA DA PERSPECTIVA: Se for o cliente a ver, invertemos a lógica!
                const displayAsIncome = isClient ? !isFirmIncome : isFirmIncome; 

                if (displayAsIncome) { 
                    acc.entradas += amount; acc.total += amount; 
                } else { 
                    acc.saidas += amount; acc.total -= amount; 
                }
            }
            return acc;
        }, { entradas: 0, saidas: 0, total: 0 });
    }, [filteredTransactions, isClient]);

    function formatCurrency(value) { 
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0); 
    }
    
    function formatDateDisplay(dateString) {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
    }

    // --- FUNÇÕES EM MASSA (BULK ACTIONS) ---
    function toggleSelect(id) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

function toggleSelectAll() {
        const pendentes = filteredTransactions.filter(t => t.status !== 'PAGO');
        
        if (selectedIds.length === pendentes.length && pendentes.length > 0) {
            setSelectedIds([]); // Se já estiverem todas selecionadas, limpa
        } else {
            setSelectedIds(pendentes.map(t => t.id)); // Seleciona APENAS as pendentes
        }
    }

    async function handleBulkPay() {
        if (!window.confirm(`Dar baixa oficial em ${selectedIds.length} transações simultaneamente?`)) return;
        setIsSubmitting(true);
        const tId = toast.loading(`A liquidar ${selectedIds.length} faturas...`);
        try {
            await Promise.all(selectedIds.map(id => {
                const formData = new FormData();
                formData.append('status', 'PAGO');
                return api.put(`/transactions/${id}`, formData);
            }));
            toast.success("Baixas em lote realizadas com sucesso!", { id: tId });
            setSelectedIds([]); 
            mutate();
        } catch { 
            toast.error("Erro no processamento em lote.", { id: tId }); 
        } finally { 
            setIsSubmitting(false); 
        }
    }

// --- FUNÇÃO DO CLIENTE: ENVIAR COMPROVATIVO PIX ---
    async function handleUploadPixReceipt(e) {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;
        if (uploadedFile.size > 5242880) return toast.error("O comprovante é muito pesado! (Máx: 5MB)");

        setIsSubmitting(true);
        const toastId = toast.loading('A enviar comprovante...');
        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);
            
            // 🔥 CORREÇÃO: Reenviamos os dados básicos para o Back-end aceitar a atualização sem perder nada
            formData.append('title', pixTransaction.title || pixTransaction.description);
            formData.append('amount', pixTransaction.amount || pixTransaction.price);
            formData.append('category', pixTransaction.category || 'Geral');
            formData.append('type', pixTransaction.type === 'income' || pixTransaction.type === 'entrada' ? 'entrada' : 'saida');
            formData.append('date', new Date(pixTransaction.date).toISOString());
            
            // 🔥 MÁGICA DE UX: Muda o status para avisar o Gestor que o cliente já pagou!
            formData.append('status', 'EM ANÁLISE'); 

            await api.put(`/transactions/${pixTransaction.id}`, formData);
            
            toast.success("Comprovante enviado! O escritório irá analisar.", { id: toastId });
            setPixTransaction(null); 
            mutate(); 
        } catch {
            toast.error("Erro ao enviar comprovante.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }

    // --- FUNÇÕES DE CRUD MANUAIS ---
    function handleOpenNew() { 
        setEditingId(null); 
        setTitle(''); 
        setPrice(''); 
        setCategory(''); 
        setType('income'); 
        setDate(''); 
        setFile(null); 
        setStatus('PAGO'); 
        setPaymentMethod(''); 
        setClientId(''); 
        setIsRecurring(false); 
        setInstallments(1); 
        setIsModalOpen(true); 
    }

    function handleEdit(t) { 
        setEditingId(t.id); 
        setTitle(t.title || t.description); 
        setPrice(t.amount || t.price || 0); 
        setCategory(t.category || ''); 
        setType(t.type === 'entrada' ? 'income' : t.type === 'saida' ? 'outcome' : t.type); 
        setDate(t.date ? new Date(t.date).toISOString().split('T')[0] : ''); 
        setStatus(t.status || 'PAGO'); 
        setPaymentMethod(t.paymentMethod || ''); 
        setClientId(t.clientId || ''); 
        setFile(null); 
        setIsRecurring(false); 
        setInstallments(1); 
        setIsModalOpen(true); 
    }

    async function handleDelete(id) { 
        if (window.confirm("Deseja excluir esta transação permanentemente?")) { 
            try { 
                await api.delete(`/transactions/${id}`); 
                mutate(); 
                toast.success("Removido com sucesso!"); 
            } catch { 
                toast.error("Erro ao eliminar transação."); 
            } 
        } 
    }

    async function handleMarkAsPaid(t) { 
        if (!window.confirm(`Dar baixa em: ${t.title || t.description}?`)) return; 
        const toastId = toast.loading('A processar baixa...'); 
        try { 
            const formData = new FormData(); 
            formData.append('status', 'PAGO'); 
            await api.put(`/transactions/${t.id}`, formData); 
            mutate(); 
            toast.success("Baixa realizada com sucesso!", { id: toastId }); 
        } catch { 
            toast.error("Erro ao dar baixa.", { id: toastId }); 
        } 
    }

    async function handleSave(e) {
        e.preventDefault();
        if (isSubmitting) return;

        // Bloqueador de Arquivo Pesado (Máx 5MB)
        if (file && file.size > 5242880) {
            return toast.error("O comprovante é muito pesado! O limite máximo é de 5MB.");
        }

        setIsSubmitting(true);
        const toastId = toast.loading('A guardar transação...');
        try {
            const apiType = type === 'income' ? 'entrada' : 'saida';
            const formData = new FormData();
            formData.append('title', title); 
            formData.append('amount', price);
            formData.append('category', category || 'Geral'); 
            formData.append('type', apiType); 
            
            // Trava de Fuso Horário para a Data
            formData.append('date', new Date(`${date}T12:00:00Z`).toISOString()); 
            formData.append('status', status); 
            formData.append('companyId', queryCompany);
            
            if (paymentMethod) formData.append('paymentMethod', paymentMethod); 
            if (clientId) formData.append('clientId', clientId); 
            if (!editingId && isRecurring) formData.append('installments', installments);
            if (file) formData.append('file', file);

            if (editingId) {
                await api.put(`/transactions/${editingId}`, formData);
            } else {
                await api.post('/transactions', formData);
            }
            
            setIsModalOpen(false); 
            mutate(); 
            toast.success("Lançamento guardado com sucesso!", { id: toastId });
        } catch { 
            toast.error("Erro ao salvar dados.", { id: toastId }); 
        } finally { 
            setIsSubmitting(false); 
        }
    }

    // --- LÓGICA DO EXTRATO OFX E ROBÔ ---
    async function handleOfxUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const tId = toast.loading("A ler e interpretar ficheiro OFX...");
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const { data } = await api.post('/ofx/parse', formData);
            setBankTransactions(data);
            toast.success(`Leitura concluída: ${data.length} movimentos encontrados no banco!`, { id: tId });
            
        } catch (error) {
            const msg = error.response?.data?.error || "Erro de conexão com o servidor na leitura do OFX.";
            toast.error(msg, { id: tId, duration: 5000 });
        } finally {
            e.target.value = null; 
        }
    }

    function handleRunAutoMatch() {
      if (!bankTransactions.length || !pendingTransactions.length) return;

      const matches = [];
      const bankUnmatched = [];
      const sysAvailable = [...pendingTransactions];

      bankTransactions.forEach(bt => {
          const btDate = new Date(bt.date);
          const btAmount = Math.abs(parseFloat(bt.amount));

          // A Inteligência de Auto-Match: Procura valor exato e data com margem de 3 dias
          const matchIdx = sysAvailable.findIndex(st => {
              const stAmount = Math.abs(parseFloat(st.amount || st.price || 0));
              const stDate = new Date(st.date);

              const diffTime = Math.abs(btDate.getTime() - stDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              return stAmount === btAmount && diffDays <= 3;
          });

          if (matchIdx !== -1) {
              matches.push({ bankTx: bt, systemTx: sysAvailable[matchIdx] });
              sysAvailable.splice(matchIdx, 1); 
          } else {
              bankUnmatched.push(bt);
          }
      });

      setAutoMatches(prev => [...prev, ...matches]);
      setBankTransactions(bankUnmatched);

      if (matches.length > 0) {
          toast.success(`A IA encontrou ${matches.length} correspondências exatas! ✨`);
      } else {
          toast.error("Nenhuma correspondência exata encontrada automaticamente.");
      }
    }

    async function handleConfirmAutoMatches() {
      if(isSubmitting) return;
      setIsSubmitting(true);
      const tId = toast.loading(`A processar ${autoMatches.length} conciliações em lote...`);
      try {
          await Promise.all(autoMatches.map(m => {
              const formData = new FormData();
              formData.append('status', 'PAGO');
              return api.put(`/transactions/${m.systemTx.id}`, formData);
          }));
          toast.success("Conciliação Mágica concluída com sucesso!", { id: tId });
          setAutoMatches([]);
          mutate();
      } catch(err) {
          toast.error("Ocorreu um erro a processar o lote.", { id: tId });
      } finally { setIsSubmitting(false); }
    }

    async function handleConciliate() {
        if (!selectedBankTx || !selectedSystemTx) return toast.error("Selecione uma conta do banco e uma do sistema!");
        
        const tId = toast.loading("A conciliar valores...");
        try {
            const formData = new FormData();
            formData.append('status', 'PAGO');
            await api.put(`/transactions/${selectedSystemTx.id}`, formData);

            setBankTransactions(prev => prev.filter(t => t.id !== selectedBankTx.id));
            setSelectedBankTx(null);
            setSelectedSystemTx(null);

            mutate(); 
            toast.success("Match manual perfeito! Conta conciliada.", { id: tId });
        } catch (error) { toast.error("Falha ao conciliar conta.", { id: tId }); }
    }

    // --- PDF E UTILITÁRIOS ---
    function handleExportPDF() {
        if (!transactions) return;
        const doc = new jsPDF();
        const primaryColor = [49, 130, 206];
        const darkColor = [26, 32, 44];
        const brandingName = user?.agencyName || user?.name || "Consultoria Financeira";

        doc.setFillColor(...darkColor); doc.rect(0, 0, 210, 42, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold");
        doc.text(brandingName, 14, 20); 
        
        doc.setFontSize(11); doc.setFont("helvetica", "normal");
        
        let clientName = isClient ? user.name : (selectedCompany?.name || 'Visão Geral (Escritório)');
        if (!isClient && clientFilter && clients && clientFilter !== "INTERNO") {
           const c = clients.find(cl => cl.id === clientFilter);
           if (c) clientName = c.fullName;
        } else if (clientFilter === "INTERNO") {
           clientName = "Caixa Interno da Agência";
        }

        doc.text(`Relatório de Lançamentos: ${clientName}`, 14, 28);
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
            const clientInfo = isClient ? '-' : (t.client ? t.client.fullName : 'Geral');
            return [
                formatDateDisplay(t.date), 
                t.title || t.description, 
                clientInfo, 
                t.category || 'Geral', 
                `${isIncome ? '+' : '-'} ${formatCurrency(amount)}`,
                t.status || 'PAGO' 
            ];
        });

        autoTable(doc, { 
            head: [["Data", "Descrição", "Cliente", "Categoria", "Valor", "Situação"]], 
            body: tableRows, 
            startY: 75, theme: 'grid', 
            headStyles: { fillColor: primaryColor, fontSize: 10 },
            styles: { fontSize: 9, textColor: [74, 85, 104] },
            alternateRowStyles: { fillColor: [247, 250, 252] }
        });

        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160, 174, 192); doc.text(`Gerado por ${brandingName} em ${new Date().toLocaleString('pt-BR')}`, 14, 290);
        }
        doc.save(`Extrato_${clientName.replace(/\s/g, '_')}.pdf`); 
        toast.success("PDF exportado com sucesso!");
    }

    function openAttachment(fileUrl) { 
        window.open(`${api.defaults.baseURL.replace('/api', '')}${fileUrl}`, '_blank'); 
    }

const renderStatusBadge = (statusValue) => {
      switch(statusValue) {
        case 'PAGO': return <span style={{ background: '#C6F6D5', color: '#22543D', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> PAGO</span>;
        case 'PENDENTE': return <span style={{ background: '#FEFCBF', color: '#B7791F', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> PENDENTE</span>;
        case 'EM ANÁLISE': return <span style={{ background: '#EBF8FF', color: '#2B6CB0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Search size={12} /> EM ANÁLISE</span>;
        case 'AGENDADO': return <span style={{ background: '#EBF8FF', color: '#2B6CB0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CalendarClock size={12} /> AGENDADO</span>;
        case 'ATRASADO': return <span style={{ background: '#FED7D7', color: '#9B2C2C', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> ATRASADO</span>;
        default: return <span style={{ background: '#EDF2F7', color: '#4A5568', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>{statusValue}</span>;
      }
    };

    if (error) return <div style={{ padding: 40, color: 'red' }}>Erro ao carregar dados financeiros. O servidor pode estar indisponível.</div>;

    const pendingTransactions = transactions ? transactions.filter(t => t.status !== 'PAGO') : [];

    if (isClient && clients && !myClientRecord && !transactions) {
        return (
          <Container style={{ textAlign: 'center', padding: 60 }}>
            <ShieldAlert size={48} color="#e53e3e" style={{ marginBottom: 16 }} />
            <h2>Acesso Pendente</h2>
            <p>Os seus dados financeiros estão a ser configurados. Fale com o seu contador.</p>
          </Container>
        );
    }

    return (
        <Container>
            <Header style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                    <h1 style={{ margin: 0, fontSize: 26, color: '#1a202c', fontWeight: 800 }}>Financeiro</h1>
                    <ButtonGroup>
                        {!isClient && (
                          <button className="secondary" onClick={() => { setIsOfxModalOpen(true); setAutoMatches([]); setBankTransactions([]); }} style={{ background: '#ebf8ff', color: '#3182ce', borderColor: '#bee3f8' }}>
                            <LinkIcon size={18} /> Conciliar Extrato (OFX)
                          </button>
                        )}
                        <button className="secondary" onClick={handleExportPDF} disabled={!transactions}>
                          <FileText size={18} /> Relatório PDF
                        </button>
                        {!isClient && (
                          <button className="primary" onClick={handleOpenNew} disabled={!transactions}>
                            <Plus size={20} /> Nova Transação
                          </button>
                        )}
                    </ButtonGroup>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', width: '100%', marginBottom: 16 }}>
                    <SearchContainer style={{ flex: '1 1 250px', maxWidth: 'none', margin: 0 }}>
                      <Search size={20} color="#a0aec0" />
                      <input placeholder="Procurar por descrição ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!transactions} />
                    </SearchContainer>
                    
                    {!isClient && (
                      <select 
                        value={clientFilter} 
                        onChange={e => setClientFilter(e.target.value)} 
                        style={{ padding: '0 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontWeight: 600, color: '#4a5568', height: 48 }}
                      >
                        <option value="">Consolidado de Clientes (BPO)</option>
                        <option value="INTERNO">Caixa Interno do Escritório</option>
                        {clients?.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                      </select>
                    )}

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
               <><SummaryContainer><SkeletonRow style={{ height: 120 }} /><SkeletonRow style={{ height: 120 }} /><SkeletonRow style={{ height: 120 }} /></SummaryContainer><TableContainer style={{ padding: 24 }}><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></TableContainer></>
            ) : (
                <>
                    <SummaryContainer>
                        <SummaryCard><header><span>Entradas (Realizado)</span><ArrowUpCircle size={24} color="#12a454" /></header><strong style={{ color: '#12a454' }}>{formatCurrency(filteredSummary.entradas)}</strong></SummaryCard>
                        <SummaryCard><header><span>Saídas (Realizado)</span><ArrowDownCircle size={24} color="#e52e4d" /></header><strong style={{ color: '#e52e4d' }}>{formatCurrency(filteredSummary.saidas)}</strong></SummaryCard>
                        <SummaryCard $highlight={true}><header><span>Saldo Disponível</span><DollarSign size={24} color="white" /></header><strong>{formatCurrency(filteredSummary.total)}</strong></SummaryCard>
                    </SummaryContainer>

                    {filteredTransactions.length === 0 ? (<p style={{textAlign: 'center', marginTop: 40, color: '#a0aec0'}}>Nenhuma movimentação encontrada neste período.</p>) : (
                        <TableContainer>
                            <Table>
<thead>
  <tr>
    {/* 1. O Master Checkbox Inteligente */}
    {!isClient && (
      <th style={{ width: 40 }}>
        <input 
          type="checkbox" 
          onChange={toggleSelectAll} 
          checked={selectedIds.length > 0 && selectedIds.length === filteredTransactions.filter(t => t.status !== 'PAGO').length} 
          disabled={filteredTransactions.filter(t => t.status !== 'PAGO').length === 0}
          title={filteredTransactions.filter(t => t.status !== 'PAGO').length === 0 ? "Todas as contas já estão pagas" : "Selecionar todas as pendentes"}
          style={{ 
            cursor: filteredTransactions.filter(t => t.status !== 'PAGO').length === 0 ? 'not-allowed' : 'pointer', 
            width: 16, 
            height: 16,
            opacity: filteredTransactions.filter(t => t.status !== 'PAGO').length === 0 ? 0.4 : 1 
          }} 
        />
      </th>
    )}

    {/* 2. As colunas originais que NÃO podem sumir! */}
    <th>Descrição / Conta</th>
    {!isClient && <th>Cliente Vinculado</th>}
    <th>Valor</th>
    <th>Categoria</th>
    <th>Data</th>
    <th>Situação</th>
    <th style={{ textAlign: 'right' }}>{isClient ? 'Pagamento' : 'Ações'}</th>
  </tr>
</thead>
<tbody>
    {filteredTransactions.map(t => {
        const amount = t.amount || t.price || 0;
        
        // 🔥 1. A MÁGICA DA PERSPECTIVA (Inverte para o cliente)
        const isFirmIncome = t.type === 'income' || t.type === 'entrada';
        const displayAsIncome = isClient ? !isFirmIncome : isFirmIncome; 
        const isNotPaid = t.status !== 'PAGO'; 
        
        return (
            <tr key={t.id} style={{ opacity: isNotPaid ? 0.8 : 1, background: t.status === 'ATRASADO' ? '#fff5f5' : selectedIds.includes(t.id) ? '#ebf8ff' : 'transparent' }}>
                
                {/* 1. A Coluna do Checkbox Transparente (UX Premium) */}
                {!isClient && (
                  <td>
                    {isNotPaid ? (
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(t.id)} 
                        onChange={() => toggleSelect(t.id)} 
                        title="Selecionar para dar baixa"
                        style={{ cursor: 'pointer', width: 16, height: 16 }} 
                      />
                    ) : (
                      <input 
                        type="checkbox" 
                        disabled 
                        title="Esta transação já está liquidada"
                        style={{ cursor: 'not-allowed', width: 16, height: 16, opacity: 0.3 }} 
                      />
                    )}
                  </td>
                )}

                {/* 2. A Coluna de Descrição com o Ícone do Cartão de Crédito */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* 🔥 2. USA A PERSPECTIVA (displayAsIncome) EM VEZ DE isIncome PARA A COR DA SETA */}
                    {displayAsIncome ? <ArrowUpCircle size={20} color="#12a454" /> : <ArrowDownCircle size={20} color="#e52e4d" />}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#2D3748' }}>{t.description || t.title}</span>
                        {t.paymentMethod && (
                            <span style={{ fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <CreditCard size={12}/> {t.paymentMethod}
                            </span>
                        )}
                    </div>
                  </div>
                </td>

                {/* 3. A Coluna do Cliente Vinculado com o Ícone User */}
                {!isClient && (
                    <td>
                        {t.client ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4a5568', fontWeight: 600 }}>
                                <User size={14} color="#a0aec0" /> {t.client.fullName}
                            </span>
                        ) : (
                            <span style={{ color: '#cbd5e0', fontSize: 13, fontStyle: 'italic' }}>Caixa Agência</span>
                        )}
                    </td>
                )}

                {/* 4. As Colunas de Valores (COM SINAL NEGATIVO CORRETO), Data e Status */}
                <td><span style={{ color: displayAsIncome ? '#12a454' : '#e52e4d', fontWeight: 'bold', display: 'block' }}>{!displayAsIncome && '- '} {formatCurrency(amount)}</span></td>
                <td><span style={{ background: '#EDF2F7', color: '#2D3748', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{t.category || 'GERAL'}</span></td>
                
                {/* 5. Coluna da Data com Ícone de Recorrência Inteligente */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {formatDateDisplay(t.date)}
                    {/* Se tiver parcelas ou "Mês" no título, mostra que é recorrente */}
                    {(t.installments > 1 || t.title?.includes('(Mês') || t.description?.includes('(Mês')) && (
                      <span title="Lançamento Recorrente (Mensalidade)">
                        <Repeat size={14} color="#3182ce" />
                      </span>
                    )}
                  </div>
                </td>
                
                <td>{renderStatusBadge(t.status || 'PAGO')}</td>
                
                {/* 6. A Coluna de Ações (PIX para Cliente, ou Botões de Editar para Gestor) */}
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {isClient ? (
                        // 🔥 3. O CLIENTE SÓ PAGA O QUE FOR DESPESA PARA ELE (!displayAsIncome)
                        (isNotPaid && !displayAsIncome) ? (
                            <ActionButton onClick={() => setPixTransaction(t)} style={{ background: '#38a169', color: 'white', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                                <QrCode size={16} /> Pagar PIX
                            </ActionButton>
                        ) : (
                            t.fileUrl ? (
                              <button onClick={() => openAttachment(t.fileUrl)} title="Ver Documento" style={{ background: '#ebf8ff', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#3182ce', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Paperclip size={18} />
                              </button>
                            ) : <span style={{ color: '#a0aec0', fontSize: 12 }}>-</span>
                        )
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            {/* Só mostra o botão de dar baixa se NÃO estiver pago */}
                            {isNotPaid && (
                                <ActionButton onClick={() => handleMarkAsPaid(t)} color="#12a454" title="Dar Baixa Manual">
                                    <CheckCircle size={18} />
                                </ActionButton>
                            )}
                            
                            {/* O clipe de papel aparece se tiver comprovativo/anexo */}
                            {t.fileUrl && (
                              <ActionButton onClick={() => openAttachment(t.fileUrl)} color="#805ad5" title="Ver Anexo / Comprovante">
                                <Paperclip size={18} />
                              </ActionButton>
                            )}
                            
                            {/* Editar muda para "Visualizar" se já estiver pago */}
                            <ActionButton onClick={() => handleEdit(t)} color="#3182ce" title={isNotPaid ? "Editar" : "Visualizar"}>
                                <Edit size={18} />
                            </ActionButton>
                            
                            {/* 🔥 4. TRAVA DE AUDITORIA: A Lixeira DESAPARECE se a conta já foi paga */}
                            {isNotPaid && (
                                <ActionButton onClick={() => handleDelete(t.id)} color="#e53e3e" title="Excluir Transação">
                                    <Trash2 size={18} />
                                </ActionButton>
                            )}
                        </div>
                    )}
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

            {/* BARRA FLUTUANTE DE AÇÕES EM MASSA */}
            {selectedIds.length > 0 && !isClient && (
              <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: '#2d3748', color: 'white', padding: '16px 32px', borderRadius: 50, display: 'flex', gap: 24, alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 1000 }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>{selectedIds.length} transações selecionadas</span>
                <button onClick={handleBulkPay} disabled={isSubmitting} style={{ background: '#38a169', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 24, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s' }}>
                  {isSubmitting ? 'A processar...' : <><CheckCircle size={18} /> Dar Baixa em Todas</>}
                </button>
              </div>
            )}

            {/* MODAL DE PAGAMENTO PIX (A JORNADA DO CLIENTE) */}
            {pixTransaction && (
              <ModalOverlay>
                <ModalContent style={{ textAlign: 'center', maxWidth: 400 }}>
                  <div style={{ background: '#f0fff4', color: '#22543d', padding: 16, borderRadius: 12, marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <QrCode size={24} /> Pagamento Rápido via PIX
                  </div>
                  <p style={{ color: '#718096', marginBottom: 24, fontSize: 14 }}>Abra a app do seu banco e escaneie o código abaixo para liquidar o documento <strong>{pixTransaction.title || pixTransaction.description}</strong>.</p>
                  
                  <div style={{ background: 'white', padding: 16, borderRadius: 16, display: 'inline-block', border: '2px solid #e2e8f0', marginBottom: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX0136financeiro@businessflow.com5204000053039865405${pixTransaction.amount || pixTransaction.price}5802BR5913BusinessFlow6009SAO%20PAULO62070503***63048593`} alt="QR Code PIX" style={{ width: 200, height: 200 }} />
                  </div>

                  <h3 style={{ fontSize: 28, color: '#2d3748', marginBottom: 32, fontWeight: 800 }}>{formatCurrency(pixTransaction.amount || pixTransaction.price)}</h3>
                  {/* 🔥 CAIXA DE UPLOAD DO COMPROVANTE PARA A DONA ANA */}
                  <div style={{ padding: '16px', background: '#f7fafc', borderRadius: '12px', border: '1px dashed #cbd5e0', marginBottom: 24, textAlign: 'left' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#4a5568', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UploadCloud size={16} color="#3182ce"/> Já pagou? Envie o comprovante:
                    </p>
                    <input 
                      type="file" 
                      onChange={handleUploadPixReceipt} 
                      accept="image/*,application/pdf" 
                      disabled={isSubmitting} 
                      style={{ width: '100%', fontSize: 12, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} 
                    />
                  </div>
                  <button onClick={() => setPixTransaction(null)} style={{ background: '#edf2f7', color: '#4a5568', padding: '14px 24px', borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer', width: '100%', transition: '0.2s' }}>
                    Fechar Janela
                  </button>
                </ModalContent>
              </ModalOverlay>
            )}

            {/* MODAL DE CONCILIAÇÃO BANCÁRIA OFX */}
            {isOfxModalOpen && !isClient && (
                <ModalOverlay>
                    <ModalContent style={{ maxWidth: 1000, background: '#f8fafc', padding: '32px 40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <div>
                                <h2 style={{ margin: '0 0 4px 0', color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <LinkIcon color="#3182ce" /> Conciliação Bancária OFX
                                </h2>
                                <p style={{ margin: 0, color: '#718096', fontSize: 14 }}>Cruze o extrato do banco com as contas pendentes de todos os clientes.</p>
                            </div>
                            <button onClick={() => { setIsOfxModalOpen(false); setBankTransactions([]); }} style={{ background: '#edf2f7', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Fechar</button>
                        </div>

                        {autoMatches.length > 0 && (
                          <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', padding: '16px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                             <div>
                                <h4 style={{ color: '#22543d', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
                                  <Wand2 size={20} color="#38a169"/> Auto-Match Concluído!
                                </h4>
                                <p style={{ color: '#276749', margin: 0, fontSize: 14 }}>A Inteligência cruzou <strong>{autoMatches.length}</strong> transações perfeitas (Data e Valor iguais).</p>
                             </div>
                             <button onClick={handleConfirmAutoMatches} disabled={isSubmitting} style={{ background: '#38a169', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 800, cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 10px rgba(56, 161, 105, 0.3)' }}>
                                {isSubmitting ? 'A aprovar...' : `Aprovar as ${autoMatches.length} em Lote`}
                             </button>
                          </div>
                        )}

                        {bankTransactions.length === 0 && autoMatches.length === 0 ? (
                            <div style={{ border: '2px dashed #cbd5e0', padding: '60px 20px', borderRadius: '16px', textAlign: 'center', background: 'white', position: 'relative' }}>
                                <input type="file" onChange={handleOfxUpload} accept=".ofx" style={{ opacity: 0, position: 'absolute', top:0, left:0, width:'100%', height:'100%', cursor:'pointer' }} />
                                <UploadCloud size={48} color="#3182ce" style={{ marginBottom: 16 }} />
                                <h3 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>Arraste o ficheiro .OFX do banco para aqui</h3>
                                <p style={{ margin: 0, color: '#a0aec0' }}>Ou clique para procurar no computador.</p>
                            </div>
                        ) : (
                            <>
                              {bankTransactions.length > 0 && pendingTransactions.length > 0 && autoMatches.length === 0 && (
                                <button onClick={handleRunAutoMatch} style={{ width: '100%', marginBottom: 24, padding: 16, background: 'linear-gradient(90deg, #3182ce 0%, #805ad5 100%)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(128, 90, 213, 0.3)' }}>
                                  <Wand2 size={20} /> Executar Robô de Auto-Match (Procurar Pares)
                                </button>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: '50vh' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                      <div style={{ padding: 16, background: '#edf2f7', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#2d3748' }}>
                                        🏦 Restantes no Banco ({bankTransactions.length})
                                      </div>
                                      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          {bankTransactions.map(bt => (
                                              <div key={bt.id} onClick={() => setSelectedBankTx(bt)} style={{ padding: 16, borderRadius: 8, border: `2px solid ${selectedBankTx?.id === bt.id ? '#3182ce' : '#e2e8f0'}`, background: selectedBankTx?.id === bt.id ? '#ebf8ff' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#2d3748' }}>{bt.description}</span>
                                                    <span style={{ fontWeight: 800, color: bt.type === 'entrada' ? '#12a454' : '#e53e3e' }}>{bt.type === 'saida' && '- '}{formatCurrency(bt.amount)}</span>
                                                  </div>
                                                  <span style={{ fontSize: 12, color: '#a0aec0' }}>Data: {formatDateDisplay(bt.date)}</span>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                      <div style={{ padding: 16, background: '#fefcbf', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#975a16' }}>
                                        ⏳ Pendentes no BusinessFlow
                                      </div>
                                      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          {pendingTransactions.length === 0 ? (<div style={{ textAlign: 'center', padding: 40, color: '#a0aec0' }}>Nenhuma conta pendente para conciliar!</div>) : (
                                              pendingTransactions.map(pt => (
                                                  <div key={pt.id} onClick={() => setSelectedSystemTx(pt)} style={{ padding: 16, borderRadius: 8, border: `2px solid ${selectedSystemTx?.id === pt.id ? '#d69e2e' : '#e2e8f0'}`, background: selectedSystemTx?.id === pt.id ? '#fffff0' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#2d3748' }}>{pt.title}</span>
                                                        <span style={{ fontWeight: 800, color: (pt.type === 'entrada' || pt.type === 'income') ? '#12a454' : '#e53e3e' }}>{formatCurrency(pt.amount || pt.price)}</span>
                                                      </div>
                                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: 12, color: '#a0aec0' }}>Vence: {formatDateDisplay(pt.date)}</span>
                                                        {pt.client && <span style={{ fontSize: 11, background: '#edf2f7', padding: '2px 6px', borderRadius: 4, color: '#4a5568' }}>{pt.client.fullName}</span>}
                                                      </div>
                                                  </div>
                                              ))
                                          )}
                                      </div>
                                  </div>

                                  <div style={{ gridColumn: '1 / -1', background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                          <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 12, color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Selecionado (Banco)</div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: selectedBankTx ? (selectedBankTx.type === 'entrada' ? '#12a454' : '#e53e3e') : '#a0aec0' }}>{selectedBankTx ? formatCurrency(selectedBankTx.amount) : 'R$ 0,00'}</div>
                                          </div>
                                          <LinkIcon size={24} color="#cbd5e0" />
                                          <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 12, color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Selecionado (Sistema)</div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: selectedSystemTx ? ((selectedSystemTx.type === 'entrada' || selectedSystemTx.type === 'income') ? '#12a454' : '#e53e3e') : '#a0aec0' }}>{selectedSystemTx ? formatCurrency(selectedSystemTx.amount || selectedSystemTx.price) : 'R$ 0,00'}</div>
                                          </div>
                                      </div>
                                      <button onClick={handleConciliate} disabled={!selectedBankTx || !selectedSystemTx} style={{ background: (!selectedBankTx || !selectedSystemTx) ? '#cbd5e0' : '#3182ce', color: 'white', border: 'none', padding: '16px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: (!selectedBankTx || !selectedSystemTx) ? 'not-allowed' : 'pointer', transition: '0.2s', boxShadow: '0 4px 6px rgba(49, 130, 206, 0.2)' }}>
                                        Conciliar Par Manualmente
                                      </button>
                                  </div>
                              </div>
                            </>
                        )}
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
            {isModalOpen && !isClient && (
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
                              <FormGroup>
                                <label>Descrição do Lançamento *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ex: Honorários Mensais" />
                              </FormGroup>
                              <FormGroup>
                                <label>Valor (R$) *</label>
                                {/* Foi mantido tipo Number nativo para evitar conflito de importação de máscaras nesta página */}
                                <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
                              </FormGroup>
                            </div>

                            <FormGroup>
                              <label>Vincular a um Cliente (BPO / Honorário)</label>
                              <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f7fafc' }}>
                                <option value="">Não vincular (Despesa Interna do Escritório)</option>
                                {clients?.map(c => (<option key={c.id} value={c.id}>{c.fullName}</option>))}
                              </select>
                            </FormGroup>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              <FormGroup>
                                <label>Categoria *</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <option value="">Selecione a conta...</option>
                                  {(type === 'income' || type === 'entrada') ? (
                                    <optgroup label="RECEITAS">
                                      <option value="Honorários Contábeis">Honorários Mensais</option>
                                      <option value="Serviços Extras">Serviços Extras</option>
                                    </optgroup>
                                  ) : (
                                    <optgroup label="CUSTOS">
                                      <option value="Folha de Pagamento">Folha de Pagamento</option>
                                      <option value="Impostos">Impostos (Simples, DARF)</option>
                                      <option value="Despesas Fixas">Despesas Fixas (Software, Aluguel)</option>
                                    </optgroup>
                                  )}
                                </select>
                              </FormGroup>
                              <FormGroup>
                                <label>Data de Vencimento *</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                              </FormGroup>
                            </div>
                            
                            {!editingId && (
                              <div style={{ background: '#f7fafc', border: '1px solid #edf2f7', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#2d3748' }}>
                                  <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                  <Repeat size={18} color="#3182ce" /> Lançamento Recorrente (Mensalidade)
                                </label>
                                {isRecurring && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '26px' }}>
                                    <span style={{ fontSize: '13px', color: '#4a5568' }}>Repetir por</span>
                                    <input type="number" min="2" max="60" value={installments} onChange={(e) => setInstallments(e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
                                    <span style={{ fontSize: '13px', color: '#4a5568' }}>meses</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              <FormGroup>
                                <label>Situação</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <option value="PAGO">✅ Pago (Em Caixa)</option>
                                  <option value="PENDENTE">⏳ Pendente</option>
                                </select>
                              </FormGroup>
                              <FormGroup>
                                <label>Meio de Pagamento</label>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <option value="">Não informado</option>
                                  <option value="PIX">PIX</option>
                                  <option value="Boleto Bancário">Boleto</option>
                                </select>
                              </FormGroup>
                            </div>
                            
                            <FormGroup>
                              <label>Comprovante (Imagem/PDF)</label>
                              <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*,application/pdf" style={{ padding: 8, background: '#f7fafc' }}/>
                            </FormGroup>

                            <ModalActions>
                              <button type="button" className="cancel" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
                              <button type="submit" className="save" disabled={isSubmitting}>{isSubmitting ? 'A salvar...' : 'Confirmar Lançamento'}</button>
                            </ModalActions>
                        </form>
                    </ModalContent>
                </ModalOverlay>
            )}
        </Container>
    );
}