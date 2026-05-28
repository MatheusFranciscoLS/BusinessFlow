import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UploadCloud, FileText, Clock, CheckCircle, 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Building2,
  AlertTriangle, Activity, ArrowRight, Filter, ChevronDown 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const Container = styled.div`width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.4s ease;`;
const WelcomeBox = styled.div`background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); padding: 32px; border-radius: 16px; color: white; margin-bottom: 32px; box-shadow: 0 10px 25px rgba(49, 130, 206, 0.2); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;`;
const CardsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 32px;`;
const StatCard = styled.div`background: white; border-radius: 12px; padding: 24px; border: 1px solid #edf2f7; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); .title { display: flex; align-items: center; justify-content: space-between; color: #718096; font-size: 14px; font-weight: 600; } .value { font-size: 28px; font-weight: 800; color: ${props => props.$color || '#2d3748'}; }`;
const ActionGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;`;
const ActionCard = styled.button`background: white; border: 1px dashed #cbd5e0; border-radius: 12px; padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: 0.2s; color: #4a5568; &:hover { border-color: #3182ce; background: #ebf8ff; color: #3182ce; transform: translateY(-2px); } strong { font-size: 16px; } span { font-size: 13px; text-align: center; }`;
const ChartsGrid = styled.div`display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 32px; @media (max-width: 1024px) { grid-template-columns: 1fr; }`;
const ChartBox = styled.div`background: white; border-radius: 12px; border: 1px solid #edf2f7; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); h3 { margin: 0 0 24px 0; color: #2d3748; font-size: 16px; display: flex; align-items: center; gap: 8px; }`;
const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(2px);`;
const ModalContent = styled.div`background: white; padding: 32px; border-radius: 16px; width: 100%; max-width: 550px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; label { font-size: 14px; font-weight: 600; color: #4a5568; } input, select, textarea { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; &:focus { border-color: #3182ce; } }`;
const ModalActions = styled.div`display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; button { padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; border: none; } .cancel { background: #edf2f7; color: #4a5568; &:hover { background: #e2e8f0; } } .save { background: #3182ce; color: white; &:hover { background: #2c5282; } }`;

const fetcher = (url) => api.get(url).then((res) => res.data);
const PIE_COLORS = ['#3182ce', '#e53e3e', '#d69e2e', '#38a169', '#805ad5', '#dd6b20', '#319795', '#718096'];

export default function Dashboard() {
  const { user, selectedCompany, changeCompany } = useAuth(); 
  const isClient = user?.role === 'CLIENT';

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [clientFilter, setClientFilter] = useState('');

  const { data: transactions, mutate } = useSWR(selectedCompany ? `/transactions?month=${currentMonth}&year=${currentYear}` : null, fetcher);
  const { data: agencySummary } = useSWR(!isClient && !selectedCompany ? '/dashboard/summary' : null, fetcher);
  const { data: clients } = useSWR(!isClient && selectedCompany ? '/clients' : null, fetcher);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 🔥 NOVO: Adicionado estado de type no form para o cliente escolher Entrada vs Saída
  const [form, setForm] = useState({ title: '', amount: '', date: '', type: 'saida', file: null });

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const { summary, barChartData, pieChartData, recentPending } = useMemo(() => {
    if (!transactions) return { summary: { entradas: 0, saidas: 0, pendentes: 0 }, barChartData: [], pieChartData: [], recentPending: [] };
    
    let filteredTransactions = transactions;
    if (clientFilter) filteredTransactions = transactions.filter(t => t.clientId === clientFilter);

    let entradas = 0; let saidas = 0; let pendentes = 0;
    const daysMap = {}; const categoriesMap = {}; const pendingList = [];

    filteredTransactions.forEach(t => {
      const val = t.amount || t.price || 0;
      const isIncome = t.type === 'entrada' || t.type === 'income';
      const isPaid = t.status === 'PAGO';

      if (isPaid) {
        if (isIncome) entradas += val; else saidas += val;
      } else {
        pendentes += 1; pendingList.push(t);
      }

      const day = String(new Date(t.date).getUTCDate()).padStart(2, '0');
      if (!daysMap[day]) daysMap[day] = { name: `Dia ${day}`, Entradas: 0, Saidas: 0 };
      if (isIncome) daysMap[day].Entradas += val; else daysMap[day].Saidas += val;

      if (!isIncome && val > 0) {
        const cat = t.category || 'Não Classificado';
        categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
      }
    });

    return { 
      summary: { entradas, saidas, pendentes }, 
      barChartData: Object.values(daysMap).sort((a, b) => a.name.localeCompare(b.name)), 
      pieChartData: Object.entries(categoriesMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      recentPending: pendingList.slice(0, 4)
    };
  }, [transactions, clientFilter]);

  async function handleSendDocument(e) {
    e.preventDefault();
    if (!form.file) return toast.error("Por favor, anexe a fatura ou o comprovativo.");
    const tId = toast.loading("A processar e enviar o documento...");
    try {
      const formData = new FormData();
      formData.append('title', form.title); 
      formData.append('description', 'Enviado via Portal do Cliente');
      formData.append('amount', form.amount); 
      
      // 🔥 AGORA O SISTEMA RESPEITA A ESCOLHA DO CLIENTE
      formData.append('type', form.type); 
      
      formData.append('category', 'A Classificar'); 
      formData.append('date', new Date(form.date).toISOString());
      formData.append('status', 'PENDENTE'); 
      formData.append('file', form.file);

      await api.post('/transactions', formData);
      toast.success("Documento entregue com sucesso à contabilidade!", { id: tId });
      setIsModalOpen(false); 
      setForm({ title: '', amount: '', date: '', type: 'saida', file: null }); 
      mutate(); 
    } catch (error) { toast.error("Erro de conexão ao enviar o documento.", { id: tId }); }
  }

  // =======================================================================
  // 🏢 VISÃO 1: SUPER PAINEL DA AGÊNCIA
  // =======================================================================
  if (!isClient && !selectedCompany) {
    return (
      <Container>
        <WelcomeBox>
          <div><h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Central de Comando</h1><p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>Visão panorâmica e monitorização de todas as empresas do escritório.</p></div><Building2 size={60} opacity={0.2} />
        </WelcomeBox>
        {!agencySummary ? (<p style={{ color: '#a0aec0', textAlign: 'center', marginTop: 40 }}>A processar a inteligência do escritório...</p>) : (
          <>
            <CardsGrid>
              <StatCard><div className="title">MRR Global (Honorários) <DollarSign size={18} color="#38a169" /></div><div className="value" style={{ color: '#38a169' }}>{formatCurrency(agencySummary.totalMRR)}</div></StatCard>
              <StatCard><div className="title">Aguardando Classificação <Clock size={18} color="#d69e2e" /></div><div className="value" style={{ color: '#d69e2e' }}>{agencySummary.totalPending} documentos</div></StatCard>
              <StatCard><div className="title">Contas Atrasadas <AlertTriangle size={18} color="#e53e3e" /></div><div className="value" style={{ color: '#e53e3e' }}>{agencySummary.totalOverdue} contas</div></StatCard>
            </CardsGrid>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #edf2f7', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #edf2f7', background: '#f7fafc' }}><h3 style={{ margin: 0, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={20} color="#3182ce" /> Status de Clientes</h3></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead><tr style={{ background: 'white', borderBottom: '1px solid #e2e8f0', color: '#718096', fontSize: 12, textTransform: 'uppercase' }}><th style={{ padding: '16px 24px' }}>Empresa</th><th style={{ padding: '16px 24px' }}>Honorários</th><th style={{ padding: '16px 24px' }}>Pendências</th><th style={{ padding: '16px 24px' }}>Atrasos</th><th style={{ padding: '16px 24px', textAlign: 'right' }}>Ação</th></tr></thead>
                  <tbody>
                    {agencySummary.companies.length === 0 ? (<tr><td colSpan="5" style={{ padding: 24, textAlign: 'center', color: '#a0aec0' }}>Nenhuma empresa cadastrada.</td></tr>) : (
                      agencySummary.companies.map(comp => (
                        <tr key={comp.id} style={{ borderBottom: '1px solid #edf2f7', transition: '0.2s' }}>
                          <td style={{ padding: '16px 24px', fontWeight: 700, color: '#2d3748' }}>{comp.name}</td>
                          <td style={{ padding: '16px 24px', color: '#38a169', fontWeight: 600 }}>{formatCurrency(comp.mrr)}</td>
                          <td style={{ padding: '16px 24px' }}>{comp.pending > 0 ? (<span style={{ background: '#fefcbf', color: '#b7791f', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{comp.pending} Docs</span>) : (<span style={{ color: '#a0aec0', fontSize: 12 }}>Limpo</span>)}</td>
                          <td style={{ padding: '16px 24px' }}>{comp.overdue > 0 ? (<span style={{ background: '#fed7d7', color: '#c53030', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{comp.overdue} Atrasadas</span>) : (<span style={{ color: '#a0aec0', fontSize: 12 }}>Limpo</span>)}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}><button onClick={() => changeCompany(comp.id)} style={{ background: '#ebf8ff', color: '#3182ce', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>Acessar <ArrowRight size={14} /></button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Container>
    );
  }

  // =======================================================================
  // 👔 VISÃO 2: GRÁFICOS (Empresa Selecionada)
  // =======================================================================
  if (!isClient && selectedCompany) {
    return (
      <Container>
        <WelcomeBox>
          <div style={{ flex: 1 }}><h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Painel Gerencial</h1><p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>Análise financeira consolidada.</p></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255, 255, 255, 0.15)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', minWidth: 280 }}>
            <Filter size={20} color="white" />
            <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: 'white', fontWeight: 600, fontSize: 15, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
              <option value="" style={{ color: '#2d3748' }}>Visão Geral (Todos os Dados)</option>
              {clients?.map(c => (<option key={c.id} value={c.id} style={{ color: '#2d3748' }}>Analisar: {c.fullName}</option>))}
            </select>
            <ChevronDown size={20} color="white" style={{ pointerEvents: 'none', opacity: 0.8 }} />
          </div>
        </WelcomeBox>

        <CardsGrid>
          <StatCard><div className="title">Entradas do Mês <ArrowUpCircle size={18} color="#12a454" /></div><div className="value" style={{ color: '#12a454' }}>{formatCurrency(summary.entradas)}</div></StatCard>
          <StatCard><div className="title">Saídas do Mês <ArrowDownCircle size={18} color="#e52e4d" /></div><div className="value" style={{ color: '#e52e4d' }}>{formatCurrency(summary.saidas)}</div></StatCard>
          <StatCard><div className="title">Documentos / Pendências <Clock size={18} color="#d69e2e" /></div><div className="value" style={{ color: '#d69e2e' }}>{summary.pendentes} avisos</div></StatCard>
        </CardsGrid>

        <ChartsGrid>
          <ChartBox>
            <h3><ArrowUpCircle size={18} color="#3182ce"/> Fluxo de Caixa Diário</h3>
            <div style={{ width: '100%', height: 300 }}>{barChartData.length === 0 ? (<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>Sem dados suficientes neste mês.</div>) : (<ResponsiveContainer><BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} tickFormatter={(val) => `R$ ${val}`} /><RechartsTooltip cursor={{ fill: '#f7fafc' }} formatter={(value) => formatCurrency(value)} /><Legend wrapperStyle={{ paddingTop: 20 }} /><Bar dataKey="Entradas" fill="#48bb78" radius={[4, 4, 0, 0]} barSize={20} /><Bar dataKey="Saidas" name="Saídas" fill="#f56565" radius={[4, 4, 0, 0]} barSize={20} /></BarChart></ResponsiveContainer>)}</div>
          </ChartBox>
          <ChartBox>
            <h3><ArrowDownCircle size={18} color="#e53e3e"/> Despesas por Categoria</h3>
            <div style={{ width: '100%', height: 300 }}>{pieChartData.length === 0 ? (<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>Nenhuma despesa registada.</div>) : (<ResponsiveContainer><PieChart><Pie data={pieChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">{pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}</Pie><RechartsTooltip formatter={(value) => formatCurrency(value)} /><Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} /></PieChart></ResponsiveContainer>)}</div>
          </ChartBox>
        </ChartsGrid>

        {recentPending.length > 0 && (
          <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #edf2f7' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={18} color="#d69e2e" /> Contas e Documentos Pendentes</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {recentPending.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fffaf0', borderRadius: 8, border: '1px solid #feebc8' }}>
                  <div><strong style={{ display: 'block', color: '#975a16', fontSize: 14 }}>{t.title || t.description}</strong><span style={{ fontSize: 12, color: '#b7791f' }}>Vencimento: {new Date(t.date).toLocaleDateString('pt-BR')}</span></div>
                  <strong style={{ color: '#e53e3e' }}>{formatCurrency(t.amount || t.price)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    );
  }

  // =======================================================================
  // 🧑‍💼 VISÃO 3: PORTAL DO CLIENTE (Acesso Restrito)
  // =======================================================================
  return (
    <Container>
      <WelcomeBox style={{ background: 'linear-gradient(135deg, #805ad5 0%, #553c9a 100%)' }}>
        <div><h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Portal do Cliente</h1><p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>Bem-vindo de volta, <strong>{user?.name}</strong>. Acompanhe a sua empresa e envie documentos.</p></div><FileText size={60} opacity={0.2} />
      </WelcomeBox>
      <CardsGrid><StatCard><div className="title">Receitas Computadas <CheckCircle size={18} color="#12a454" /></div><div className="value" style={{ color: '#12a454' }}>{formatCurrency(summary.entradas)}</div></StatCard><StatCard><div className="title">Despesas Pagas <DollarSign size={18} color="#e52e4d" /></div><div className="value" style={{ color: '#e52e4d' }}>{formatCurrency(summary.saidas)}</div></StatCard><StatCard><div className="title">Aguardando o Contador <Clock size={18} color="#d69e2e" /></div><div className="value" style={{ color: '#d69e2e' }}>{summary.pendentes} documentos</div></StatCard></CardsGrid>
      <h3 style={{ color: '#2d3748', marginBottom: 16 }}>Ações Rápidas</h3>
      <ActionGrid>
        <ActionCard onClick={() => setIsModalOpen(true)}>
          <UploadCloud size={40} color="#3182ce" />
          <strong>Enviar Documentos Financeiros</strong>
          <span>Envie contas a pagar ou comprovativos de vendas.</span>
        </ActionCard>
      </ActionGrid>
      
      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2 style={{ marginBottom: 20 }}>Enviar Documento para a Contabilidade</h2>
            <form onSubmit={handleSendDocument}>
              
              {/* 🔥 ESCOLHA INTELIGENTE DO CLIENTE (RECEITA VS DESPESA) */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, background: '#f7fafc', padding: '12px', borderRadius: 8, border: '1px solid #edf2f7' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: form.type === 'saida' ? '#e53e3e' : '#718096' }}>
                  <input type="radio" name="docType" checked={form.type === 'saida'} onChange={() => setForm({...form, type: 'saida'})} />
                  <ArrowDownCircle size={18} /> É uma Despesa (A Pagar)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: form.type === 'entrada' ? '#12a454' : '#718096' }}>
                  <input type="radio" name="docType" checked={form.type === 'entrada'} onChange={() => setForm({...form, type: 'entrada'})} />
                  <ArrowUpCircle size={18} /> É uma Receita (Venda)
                </label>
              </div>

              <FormGroup><label>Do que se trata este documento?</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Ex: Fatura Internet / NF Venda 100" /></FormGroup>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup><label>Valor (R$)</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required /></FormGroup>
                <FormGroup><label>Data / Vencimento</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></FormGroup>
              </div>
              <FormGroup style={{ marginTop: 8 }}>
                <label>Anexar o PDF ou Foto (Obrigatório)</label>
                <div style={{ border: '2px dashed #cbd5e0', padding: '24px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', position: 'relative', background: '#f7fafc' }}>
                  <input type="file" onChange={e => setForm({...form, file: e.target.files[0]})} accept="image/*,application/pdf" style={{ opacity: 0, position: 'absolute', top:0, left:0, width:'100%', height:'100%', cursor:'pointer' }} required />
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color: '#4a5568' }}><UploadCloud size={28} style={{ marginBottom: 8, color: '#3182ce' }} /><span style={{ fontSize: 14, fontWeight: 600 }}>{form.file ? form.file.name : "Clique para anexar o seu arquivo aqui"}</span></div>
                </div>
              </FormGroup>
              <ModalActions><button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button><button type="submit" className="save">Enviar Documento Seguro</button></ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}