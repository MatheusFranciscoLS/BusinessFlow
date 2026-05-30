import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, Plus, Clock, AlertTriangle, Zap, Building2, 
  CheckCircle, ListTodo, ShieldAlert, DollarSign, ArrowDownCircle, ArrowUpCircle, Receipt
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';

// --- ESTILOS ---
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const Container = styled.div`width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.4s ease;`;
const Header = styled.header`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; h1 { font-size: 26px; color: #1a202c; font-weight: 800; display: flex; align-items: center; gap: 12px; }`;
const ActionGroup = styled.div`display: flex; gap: 12px; flex-wrap: wrap;`;
const Button = styled.button`display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);`;

const CardsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 32px;`;
const StatCard = styled.div`background: white; border-radius: 12px; padding: 24px; border: 1px solid #edf2f7; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); .title { display: flex; align-items: center; justify-content: space-between; color: #718096; font-size: 14px; font-weight: 600; } .value { font-size: 28px; font-weight: 800; color: ${props => props.$color || '#2d3748'}; }`;

// 🔥 ESTILOS DAS NOVAS ABAS INTERNAS
const TabsContainer = styled.div`display: flex; gap: 32px; border-bottom: 2px solid #edf2f7; margin-bottom: 24px; overflow-x: auto;`;
const TabButton = styled.button`background: none; border: none; padding: 12px 0; font-size: 16px; font-weight: 800; color: ${props => props.$active ? '#3182ce' : '#a0aec0'}; border-bottom: 3px solid ${props => props.$active ? '#3182ce' : 'transparent'}; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; white-space: nowrap; &:hover { color: ${props => props.$active ? '#3182ce' : '#718096'}; }`;

// Estilos Kanban
const KanbanBoard = styled.div`display: flex; gap: 24px; overflow-x: auto; padding-bottom: 16px; min-height: 45vh; align-items: flex-start; animation: ${fadeIn} 0.3s ease;`;
const Column = styled.div`flex: 1; min-width: 300px; background: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column;`;
const ColumnHeader = styled.div`padding: 16px; font-weight: 800; font-size: 15px; color: ${props => props.$color}; border-bottom: 2px solid ${props => props.$color}30; display: flex; justify-content: space-between; align-items: center; background: ${props => props.$bg}; border-radius: 12px 12px 0 0;`;
const Card = styled.div`background: white; margin: 12px; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: ${props => props.$isClient ? 'default' : 'grab'}; transition: 0.2s; border-left: 4px solid ${props => props.$priorityColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.02); &:hover { box-shadow: ${props => props.$isClient ? 'none' : '0 4px 12px rgba(0,0,0,0.08)'}; transform: ${props => props.$isClient ? 'none' : 'translateY(-2px)'}; } &:active { cursor: grabbing; }`;

// Estilos Radar Financeiro
const RadarGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; animation: ${fadeIn} 0.3s ease;`;
const RadarCard = styled.div`background: white; border-radius: 12px; border: 1px solid #edf2f7; padding: 20px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: 0.2s; border-top: 4px solid ${props => props.$isIncome ? '#48bb78' : '#e53e3e'}; &:hover { box-shadow: 0 6px 12px rgba(0,0,0,0.05); transform: translateY(-2px); }`;

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(2px);`;
const ModalContent = styled.div`background: white; padding: 32px; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; label { font-size: 13px; font-weight: 700; color: #4a5568; text-transform: uppercase; } input, select, textarea { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; &:focus { border-color: #3182ce; } }`;

const fetcher = (url) => api.get(url).then(res => res.data);

const COLUMNS = [
  { id: 'A_FAZER', title: 'A Fazer', color: '#4a5568', bg: '#edf2f7', icon: <ListTodo size={18} /> },
  { id: 'EM_ANDAMENTO', title: 'Em Processamento', color: '#d69e2e', bg: '#fffff0', icon: <Clock size={18} /> },
  { id: 'CONCLUIDO', title: 'Concluído / Entregue', color: '#38a169', bg: '#f0fff4', icon: <CheckCircle size={18} /> }
];

export default function Agenda() {
  const { user, selectedCompany } = useAuth();
  const isClient = user?.role === 'CLIENT';

  const queryCompany = isClient ? user.companyAccessId : selectedCompany?.id;
  
  // FETCH DE DADOS DUPLOS
  const { data: clients } = useSWR(!isClient && queryCompany ? '/clients' : null, fetcher);
  const { data: tasks, mutate: mutateTasks } = useSWR(queryCompany ? `/tasks?companyId=${queryCompany}` : null, fetcher);
  const { data: allTransactions, mutate: mutateTrans } = useSWR(queryCompany ? `/transactions?companyId=${queryCompany}` : null, fetcher);
  
  const myClientRecord = useMemo(() => {
    if (!isClient || !clients) return null;
    return clients.find(c => c.email === user.email);
  }, [isClient, clients, user]);

  const visibleTasks = useMemo(() => {
    if (!tasks) return [];
    if (isClient && myClientRecord) return tasks.filter(t => t.clientId === myClientRecord.id);
    return tasks;
  }, [tasks, isClient, myClientRecord]);

  const pendingTransactions = useMemo(() => {
    if (!allTransactions) return [];
    let pendings = allTransactions.filter(t => t.status !== 'PAGO');
    if (isClient && myClientRecord) pendings = pendings.filter(t => t.clientId === myClientRecord.id);
    return pendings.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allTransactions, isClient, myClientRecord]);

  // 🔥 ESTADO DE CONTROLE DAS ABAS (Inicia sempre no Kanban)
  const [activeTab, setActiveTab] = useState('KANBAN');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'NORMAL', dueDate: '', clientId: '' });
  const [isScanning, setIsScanning] = useState(false);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleDragStart = (e, taskId) => { if (isClient) return; e.dataTransfer.setData('taskId', taskId); };
  const handleDragOver = (e) => { if (isClient) return; e.preventDefault(); };
  const handleDrop = async (e, newStatus) => {
    if (isClient) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    mutateTasks(updatedTasks, false);

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      mutateTasks(); 
    } catch (err) {
      toast.error("Erro ao mover a tarefa.");
      mutateTasks(); 
    }
  };

  async function handleCreateTask(e) {
    e.preventDefault();
    const tId = toast.loading("A criar prazo...");
    try {
      await api.post('/tasks', { ...form, companyId: queryCompany });
      toast.success("Obrigação criada!", { id: tId });
      setIsModalOpen(false);
      setForm({ title: '', description: '', priority: 'NORMAL', dueDate: '', clientId: '' });
      mutateTasks();
    } catch (err) { toast.error("Erro ao criar obrigação.", { id: tId }); }
  }

  async function handleAutoScan() {
    setIsScanning(true);
    const tId = toast.loading("A verificar Certificados Digitais...");
    try {
      const res = await api.post('/tasks/auto-scan', { companyId: queryCompany });
      if (res.data.newTasksGenerated > 0) {
        toast.success(`Automação concluída! ${res.data.newTasksGenerated} alertas gerados.`, { id: tId, duration: 4000 });
      } else {
        toast.success("Tudo em dia! Nenhum certificado a vencer.", { id: tId, duration: 4000 });
      }
      mutateTasks();
    } catch (err) { toast.error("Falha ao executar o robô.", { id: tId }); } 
    finally { setIsScanning(false); }
  }

  async function handlePayBoleto(t) {
    if (!window.confirm(`Dar baixa em: ${t.title || t.description}? O valor constará como PAGO no módulo Financeiro.`)) return;
    const toastId = toast.loading('A processar conciliação...');
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
        if(t.clientId) formData.append('clientId', t.clientId);

        await api.put(`/transactions/${t.id}`, formData);
        mutateTrans(); 
        toast.success("Baixa realizada com sucesso!", { id: toastId });
    } catch { toast.error("Erro ao dar baixa.", { id: toastId }); }
  }

  const getPriorityColor = (prio) => {
    switch(prio) { case 'URGENTE': return '#e53e3e'; case 'ALTA': return '#ed8936'; case 'NORMAL': return '#3182ce'; default: return '#a0aec0'; }
  };

  if (isClient && clients && !myClientRecord) {
    return (
      <Container style={{ textAlign: 'center', padding: 60 }}>
        <ShieldAlert size={48} color="#e53e3e" style={{ marginBottom: 16 }} />
        <h2>Acesso Pendente</h2>
        <p>O seu e-mail não foi encontrado no dossiê. Fale com o seu contador.</p>
      </Container>
    );
  }

  const pendingTasksCount = visibleTasks.filter(t => t.status !== 'CONCLUIDO').length;
  const overdueTasksCount = visibleTasks.filter(t => new Date(t.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && t.status !== 'CONCLUIDO').length;
  const toPayCount = pendingTransactions.filter(t => t.type === 'saida' || t.type === 'outcome').length;
  const toReceiveCount = pendingTransactions.filter(t => t.type === 'entrada' || t.type === 'income').length;

  return (
    <Container>
      <Header>
        <h1><Calendar color="#3182ce" size={32} /> Painel de Comando Unificado</h1>
        {!isClient && (
          <ActionGroup>
            {/* O Botão de Varredura só faz sentido na aba de Kanban */}
            {activeTab === 'KANBAN' && (
              <Button onClick={handleAutoScan} disabled={isScanning} style={{ background: '#fffaf0', color: '#dd6b20', border: '1px solid #fbd38d' }}>
                <Zap size={18} /> {isScanning ? 'A verificar...' : 'Varredura de Prazos'}
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)} style={{ background: '#3182ce', color: 'white' }}>
              <Plus size={18} /> Novo Prazo / Obrigação
            </Button>
          </ActionGroup>
        )}
      </Header>

      <CardsGrid>
        <StatCard>
          <div className="title">Obrigações Pendentes <ListTodo size={18} color="#3182ce" /></div>
          <div className="value" style={{ color: '#3182ce' }}>{pendingTasksCount}</div>
        </StatCard>
        <StatCard>
          <div className="title">Obrigações Atrasadas <AlertTriangle size={18} color="#e53e3e" /></div>
          <div className="value" style={{ color: '#e53e3e' }}>{overdueTasksCount}</div>
        </StatCard>
        <StatCard>
          <div className="title">Contas a Receber (BPO) <ArrowUpCircle size={18} color="#38a169" /></div>
          <div className="value" style={{ color: '#38a169' }}>{toReceiveCount}</div>
        </StatCard>
        <StatCard>
          <div className="title">Contas a Pagar (BPO) <ArrowDownCircle size={18} color="#e53e3e" /></div>
          <div className="value" style={{ color: '#e53e3e' }}>{toPayCount}</div>
        </StatCard>
      </CardsGrid>

      {/* 🔥 O NAVEGADOR DE ABAS 🔥 */}
      <TabsContainer>
        <TabButton 
          $active={activeTab === 'KANBAN'} 
          onClick={() => setActiveTab('KANBAN')}
        >
          <ListTodo size={20} /> Quadro Operacional (Fiscal & RH)
        </TabButton>
        <TabButton 
          $active={activeTab === 'BPO'} 
          onClick={() => setActiveTab('BPO')}
        >
          <DollarSign size={20} /> Radar de Contas (BPO Financeiro)
          {pendingTransactions.length > 0 && (
            <span style={{ background: '#e53e3e', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>
              {pendingTransactions.length}
            </span>
          )}
        </TabButton>
      </TabsContainer>

      {/* CONTEÚDO CONDICIONAL BASEADO NA ABA SELECIONADA */}
      
      {activeTab === 'KANBAN' && (
        <div style={{ marginBottom: 40 }}>
          {!tasks ? (
            <p style={{ color: '#a0aec0' }}>A carregar quadro fiscal...</p>
          ) : (
            <KanbanBoard>
              {COLUMNS.map(col => (
                <Column key={col.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                  <ColumnHeader $color={col.color} $bg={col.bg}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{col.icon} {col.title}</span>
                    <span style={{ background: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                      {visibleTasks.filter(t => t.status === col.id).length}
                    </span>
                  </ColumnHeader>
                  
                  <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
                    {visibleTasks.filter(t => t.status === col.id).map(task => {
                      const isOverdue = new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && task.status !== 'CONCLUIDO';
                      return (
                        <Card 
                          key={task.id} $priorityColor={getPriorityColor(task.priority)} $isClient={isClient}
                          draggable={!isClient} onDragStart={(e) => handleDragStart(e, task.id)}
                        >
                          <h4 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: 15 }}>{task.title}</h4>
                          {!isClient && task.client && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#718096', marginBottom: 8, fontWeight: 600 }}>
                              <Building2 size={12} /> {task.client.fullName}
                            </div>
                          )}
                          {task.description && (
                            <p style={{ fontSize: 12, color: '#4a5568', margin: '0 0 12px 0', background: '#f7fafc', padding: 8, borderRadius: 6 }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 700 }}>
                            <span style={{ color: getPriorityColor(task.priority), background: `${getPriorityColor(task.priority)}15`, padding: '4px 8px', borderRadius: 6 }}>
                              {task.priority}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isOverdue ? '#e53e3e' : '#718096' }}>
                              {isOverdue ? <AlertTriangle size={14} /> : <Clock size={14} />} 
                              {new Date(task.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </Column>
              ))}
            </KanbanBoard>
          )}
        </div>
      )}

      {activeTab === 'BPO' && (
        <div>
          {!allTransactions ? (
             <p style={{ color: '#a0aec0' }}>A carregar radar financeiro...</p>
          ) : pendingTransactions.length === 0 ? (
            <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', padding: 24, borderRadius: 12, color: '#22543d', display: 'flex', alignItems: 'center', gap: 12, animation: `${fadeIn} 0.3s ease` }}>
              <CheckCircle size={24} /> <strong>Excelente!</strong> Não existem pendências financeiras para o período.
            </div>
          ) : (
            <RadarGrid>
              {pendingTransactions.map(t => {
                const isIncome = t.type === 'entrada' || t.type === 'income';
                const isOverdue = new Date(t.date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

                return (
                  <RadarCard key={t.id} $isIncome={isIncome}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isIncome ? <ArrowUpCircle size={20} color="#48bb78" /> : <ArrowDownCircle size={20} color="#e53e3e" />}
                        <strong style={{ color: '#2d3748', fontSize: 15 }}>{t.title || t.description}</strong>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: isIncome ? '#38a169' : '#e53e3e' }}>
                         {formatCurrency(t.amount || t.price)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#718096' }}>
                      {!isClient && t.client && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={14}/> {t.client.fullName}</span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Receipt size={14}/> {t.category || 'Geral'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: isOverdue ? '#e53e3e' : '#718096', fontWeight: isOverdue ? 700 : 400 }}>
                        <Clock size={14}/> Vencimento: {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} {isOverdue && "(Atrasado)"}
                      </span>
                    </div>

                    {!isClient && (
                      <div style={{ borderTop: '1px solid #edf2f7', paddingTop: 12, marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handlePayBoleto(t)} 
                          style={{ background: '#f7fafc', border: '1px solid #e2e8f0', color: '#4a5568', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: '0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.background = '#38a169'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#38a169'; }}
                          onMouseOut={e => { e.currentTarget.style.background = '#f7fafc'; e.currentTarget.style.color = '#4a5568'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                          <CheckCircle size={16} /> Dar Baixa (Marcar como Pago)
                        </button>
                      </div>
                    )}
                  </RadarCard>
                )
              })}
            </RadarGrid>
          )}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO MANUAL DO KANBAN */}
      {isModalOpen && !isClient && (
        <ModalOverlay>
          <ModalContent>
            <h2 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#2d3748' }}>
              <Calendar color="#3182ce" /> Agendar Obrigação Fiscal
            </h2>
            <form onSubmit={handleCreateTask}>
              <FormGroup>
                <label>Título da Obrigação</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Ex: Enviar DAS Simples Nacional" />
              </FormGroup>

              <FormGroup>
                <label>Vincular a Cliente (Opcional)</label>
                <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
                  <option value="">Obrigação Interna da Agência...</option>
                  {clients?.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </FormGroup>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>Data de Vencimento</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required />
                </FormGroup>
                <FormGroup>
                  <label>Prioridade</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="BAIXA">Baixa</option>
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </FormGroup>
              </div>

              <FormGroup>
                <label>Instruções / Notas</label>
                <textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Observações para a equipa (opcional)..." style={{ fontFamily: 'inherit' }} />
              </FormGroup>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#edf2f7', color: '#4a5568', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ background: '#3182ce', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Salvar no Quadro</button>
              </div>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}