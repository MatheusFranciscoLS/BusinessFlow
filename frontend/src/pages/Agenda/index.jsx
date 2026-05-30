import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, Plus, Clock, AlertTriangle, Zap, Building2, 
  CheckCircle, ListTodo, ShieldAlert
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const Container = styled.div`width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.4s ease;`;
const Header = styled.header`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; h1 { font-size: 26px; color: #1a202c; font-weight: 800; display: flex; align-items: center; gap: 12px; }`;
const ActionGroup = styled.div`display: flex; gap: 12px; flex-wrap: wrap;`;
const Button = styled.button`display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);`;

const KanbanBoard = styled.div`display: flex; gap: 24px; overflow-x: auto; padding-bottom: 16px; min-height: 60vh; align-items: flex-start;`;
const Column = styled.div`flex: 1; min-width: 300px; background: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column;`;
const ColumnHeader = styled.div`padding: 16px; font-weight: 800; font-size: 15px; color: ${props => props.$color}; border-bottom: 2px solid ${props => props.$color}30; display: flex; justify-content: space-between; align-items: center; background: ${props => props.$bg}; border-radius: 12px 12px 0 0;`;

const Card = styled.div`background: white; margin: 12px; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: ${props => props.$isClient ? 'default' : 'grab'}; transition: 0.2s; border-left: 4px solid ${props => props.$priorityColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.02); &:hover { box-shadow: ${props => props.$isClient ? 'none' : '0 4px 12px rgba(0,0,0,0.08)'}; transform: ${props => props.$isClient ? 'none' : 'translateY(-2px)'}; } &:active { cursor: grabbing; }`;

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
  
  const { data: clients } = useSWR(!isClient && queryCompany ? '/clients' : null, fetcher);
  
  const myClientRecord = useMemo(() => {
    if (!isClient || !clients) return null;
    return clients.find(c => c.email === user.email);
  }, [isClient, clients, user]);

  const { data: tasks, mutate } = useSWR(queryCompany ? `/tasks?companyId=${queryCompany}` : null, fetcher);

  // O cliente só vê as tarefas relacionadas a ele
  const visibleTasks = useMemo(() => {
    if (!tasks) return [];
    if (isClient && myClientRecord) return tasks.filter(t => t.clientId === myClientRecord.id);
    return tasks;
  }, [tasks, isClient, myClientRecord]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'NORMAL', dueDate: '', clientId: '' });
  const [isScanning, setIsScanning] = useState(false);

  // --- FUNÇÕES MÁGICAS DO KANBAN (DRAG & DROP HTML5) ---
  const handleDragStart = (e, taskId) => {
    if (isClient) return; // Cliente não arrasta
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    if (isClient) return;
    e.preventDefault(); // Necessário para permitir o "Drop"
  };

  const handleDrop = async (e, newStatus) => {
    if (isClient) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    // Encontra a tarefa para não a atualizar se caiu na mesma coluna
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Atualização Otimista (Muda no ecrã imediatamente antes do servidor responder)
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    mutate(updatedTasks, false);

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      mutate(); // Confirma com o servidor
    } catch (err) {
      toast.error("Erro ao mover a tarefa.");
      mutate(); // Reverte em caso de erro
    }
  };

  // --- CRUD e AUTOMAÇÃO ---
  async function handleCreateTask(e) {
    e.preventDefault();
    const tId = toast.loading("A criar prazo...");
    try {
      await api.post('/tasks', { ...form, companyId: queryCompany });
      toast.success("Obrigação criada!", { id: tId });
      setIsModalOpen(false);
      setForm({ title: '', description: '', priority: 'NORMAL', dueDate: '', clientId: '' });
      mutate();
    } catch (err) {
      toast.error("Erro ao criar obrigação.", { id: tId });
    }
  }

  async function handleAutoScan() {
    setIsScanning(true);
    const tId = toast.loading("A verificar Certificados Digitais dos clientes...");
    try {
      const res = await api.post('/tasks/auto-scan', { companyId: queryCompany });
      if (res.data.newTasksGenerated > 0) {
        toast.success(`Automação concluída! ${res.data.newTasksGenerated} novos alertas gerados.`, { id: tId, duration: 4000 });
      } else {
        toast.success("Tudo em dia! Nenhum certificado a vencer nos próximos 30 dias.", { id: tId, duration: 4000 });
      }
      mutate();
    } catch (err) {
      toast.error("Falha ao executar o robô de varredura.", { id: tId });
    } finally {
      setIsScanning(false);
    }
  }

  const getPriorityColor = (prio) => {
    switch(prio) {
      case 'URGENTE': return '#e53e3e';
      case 'ALTA': return '#ed8936';
      case 'NORMAL': return '#3182ce';
      default: return '#a0aec0';
    }
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

  return (
    <Container>
      <Header>
        <h1><Calendar color="#3182ce" size={32} /> Agenda e Obrigações Fiscais</h1>
        {!isClient && (
          <ActionGroup>
            <Button onClick={handleAutoScan} disabled={isScanning} style={{ background: '#fffaf0', color: '#dd6b20', border: '1px solid #fbd38d' }}>
              <Zap size={18} /> {isScanning ? 'A verificar...' : 'Varredura de Prazos'}
            </Button>
            <Button onClick={() => setIsModalOpen(true)} style={{ background: '#3182ce', color: 'white' }}>
              <Plus size={18} /> Novo Prazo / Obrigação
            </Button>
          </ActionGroup>
        )}
      </Header>

      {!tasks ? (
        <p style={{ color: '#a0aec0', textAlign: 'center' }}>A carregar quadro fiscal...</p>
      ) : (
        <KanbanBoard>
          {COLUMNS.map(col => (
            <Column 
              key={col.id} 
              onDragOver={handleDragOver} 
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <ColumnHeader $color={col.color} $bg={col.bg}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{col.icon} {col.title}</span>
                <span style={{ background: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                  {visibleTasks.filter(t => t.status === col.id).length}
                </span>
              </ColumnHeader>
              
              <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
                {visibleTasks.filter(t => t.status === col.id).map(task => {
                  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'CONCLUIDO';
                  return (
                    <Card 
                      key={task.id} 
                      $priorityColor={getPriorityColor(task.priority)}
                      $isClient={isClient}
                      draggable={!isClient}
                      onDragStart={(e) => handleDragStart(e, task.id)}
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

      {/* MODAL DE CRIAÇÃO MANUAL (Apenas para o Escritório) */}
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