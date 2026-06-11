import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, Plus, Clock, AlertTriangle, Zap, Building2, 
  CheckCircle, ListTodo, DollarSign, ArrowDownCircle, ArrowUpCircle, Receipt, Repeat,
  Trash2, ArrowRight
} from 'lucide-react';

import {
  Container, Header, ActionGroup, Button, CardsGrid, StatCard,
  TabsContainer, TabButton, KanbanBoard, Column, ColumnHeader, Card,
  RadarGrid, RadarCard, ModalOverlay, ModalContent, FormGroup
} from './styles';

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
  
  const { data: clients } = useSWR(!isClient && queryCompany ? `/clients?companyId=${queryCompany}` : null, fetcher);
  
  // 🔥 SEGURANÇA TOTAL: O backend extrai a identidade do token!
  const queryParams = queryCompany ? `?companyId=${queryCompany}` : null;

  const { data: tasks, mutate: mutateTasks } = useSWR(queryParams ? `/tasks${queryParams}` : null, fetcher);
  const { data: allTransactions, mutate: mutateTrans } = useSWR(queryParams ? `/transactions${queryParams}` : null, fetcher);
  
  const visibleTasks = useMemo(() => tasks || [], [tasks]);
  
  const pendingTransactions = useMemo(() => {
    return (allTransactions || [])
      .filter(t => t.status !== 'PAGO')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allTransactions]);

  const [activeTab, setActiveTab] = useState('KANBAN');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'NORMAL', dueDate: '', clientId: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [installments, setInstallments] = useState(1);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // --- KANBAN LOGIC ---
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

  const todayStr = new Date().toISOString().split('T')[0];

async function handleCreateTask(e) {
    e.preventDefault();
    const tId = toast.loading("A criar prazo...");
    try {
      // 🔥 AQUI ENVIAMOS A ORDEM DE REPETIÇÃO PARA O SERVIDOR!
      await api.post('/tasks', { ...form, companyId: queryCompany, installments: isRecurring ? installments : 1 });
      toast.success("Obrigação criada!", { id: tId });
      setIsModalOpen(false);
      setForm({ title: '', description: '', priority: 'NORMAL', dueDate: '', clientId: '' });
      mutateTasks();
    } catch (err) { toast.error("Erro ao criar obrigação.", { id: tId }); }
  }

  async function handleDeleteTask(taskId) {
    if(!window.confirm("Apagar esta obrigação do quadro?")) return;
    const tId = toast.loading("A excluir...");
    try {
      await api.delete(`/tasks/${taskId}`);
      mutateTasks();
      toast.success("Obrigação excluída!", { id: tId });
    } catch (err) { toast.error("Erro ao excluir.", { id: tId }); }
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

  // --- BPO LOGIC ---
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

  const sortedTasks = useMemo(() => {
    return [...visibleTasks].sort((a, b) => {
      const aOverdue = new Date(a.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && a.status !== 'CONCLUIDO';
      const bOverdue = new Date(b.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && b.status !== 'CONCLUIDO';
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      const pWeight = { 'URGENTE': 4, 'ALTA': 3, 'NORMAL': 2, 'BAIXA': 1 };
      if (pWeight[a.priority] !== pWeight[b.priority]) return pWeight[b.priority] - pWeight[a.priority];
      
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [visibleTasks]);
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

<TabsContainer>
        <TabButton $active={activeTab === 'KANBAN'} onClick={() => setActiveTab('KANBAN')}>
          <ListTodo size={20} /> Quadro Operacional (Fiscal & RH)
          {/* 🔥 NOVO: Badge inteligente que avisa quantas tarefas não estão concluídas */}
          {pendingTasksCount > 0 && (
            <span style={{ background: '#e53e3e', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 12, marginLeft: 8 }}>
              {pendingTasksCount}
            </span>
          )}
        </TabButton>
        <TabButton $active={activeTab === 'BPO'} onClick={() => setActiveTab('BPO')}>
          <DollarSign size={20} /> Radar de Contas (BPO Financeiro)
          {/* O badge do financeiro que já funcionava perfeitamente */}
          {pendingTransactions.length > 0 && (
            <span style={{ background: '#e53e3e', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 12, marginLeft: 8 }}>
              {pendingTransactions.length}
            </span>
          )}
        </TabButton>
      </TabsContainer>

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
                    {/* 🔥 Troca visibleTasks por sortedTasks */}
                    {sortedTasks.filter(t => t.status === col.id).map(task => {
                      const isOverdue = new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && task.status !== 'CONCLUIDO';
                      
                      return (
                        <Card 
                          key={task.id} 
                          $priorityColor={getPriorityColor(task.priority)} 
                          $isClient={isClient} 
                          draggable={!isClient} 
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          style={{ background: isOverdue ? '#fff5f5' : 'white', opacity: task.status === 'CONCLUIDO' ? 0.7 : 1 }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <h4 style={{ margin: 0, color: isOverdue ? '#9b2c2c' : '#2d3748', fontSize: 15, fontWeight: 800 }}>{task.title}</h4>
                            
                            {/* O BOTÃO DE EXCLUIR PARA A EQUIPA */}
                            {!isClient && (
                              <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#cbd5e0', cursor: 'pointer', padding: 0, transition: '0.2s' }} title="Excluir Obrigação" onMouseOver={e => e.currentTarget.style.color = '#e53e3e'} onMouseOut={e => e.currentTarget.style.color = '#cbd5e0'}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          {!isClient && task.client && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#718096', marginBottom: 8, fontWeight: 600 }}>
                              <Building2 size={12} /> {task.client.fullName}
                            </div>
                          )}
                          
                          {task.description && (
                            <p style={{ fontSize: 12, color: '#4a5568', margin: '0 0 12px 0', background: isOverdue ? 'white' : '#f7fafc', padding: 8, borderRadius: 6 }}>{task.description}</p>
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
            <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', padding: 24, borderRadius: 12, color: '#22543d', display: 'flex', alignItems: 'center', gap: 12 }}>
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

{/* AÇÃO DO GESTOR: Dar Baixa */}
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

                    {/* AÇÃO DO CLIENTE: Pagar Conta */}
                    {isClient && !isIncome && (
                      <div style={{ borderTop: '1px solid #edf2f7', paddingTop: 12, marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                         {/* Usa navegação via hash para manter o SPA rápido */}
                         <button onClick={() => window.location.hash = '#/app/financeiro'} style={{ background: '#38a169', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: '0.2s', boxShadow: '0 2px 6px rgba(56,161,105,0.3)' }}>
                            Pagar no Financeiro <ArrowRight size={16} />
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

      {/* MODAL KANBAN */}
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
  <input 
    type="date" 
    min={todayStr} /* 🔥 IMPEDE PRAZOS RETROATIVOS */
    value={form.dueDate} 
    onChange={e => setForm({...form, dueDate: e.target.value})} 
    required 
  />
</FormGroup>
<div style={{ background: '#f7fafc', border: '1px solid #edf2f7', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#2d3748' }}>
    <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} style={{ width: '18px', height: '18px' }} />
    <Repeat size={18} color="#3182ce" /> Tornar esta obrigação recorrente (Mensal)
  </label>
  {isRecurring && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '26px' }}>
      <span style={{ fontSize: '13px', color: '#4a5568' }}>Gerar prazos para os próximos</span>
      <input type="number" min="2" max="60" value={installments} onChange={(e) => setInstallments(e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
      <span style={{ fontSize: '13px', color: '#4a5568' }}>meses</span>
    </div>
  )}
</div>
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