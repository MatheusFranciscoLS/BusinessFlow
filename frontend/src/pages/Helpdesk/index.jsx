import React, { useState, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LifeBuoy, Plus, MessageSquare, Clock, CheckCircle, 
  AlertCircle, Send, User, Building2, X, ShieldAlert
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';

// --- ESTILOS VISUAIS ---
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const Container = styled.div`width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.4s ease;`;
const Header = styled.header`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; h1 { font-size: 26px; color: #1a202c; font-weight: 800; display: flex; align-items: center; gap: 12px; }`;
const ActionButton = styled.button`display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; background: #3182ce; color: white; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2); &:hover { background: #2c5282; transform: translateY(-2px); }`;

const CardsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 32px;`;
const StatCard = styled.div`background: white; border-radius: 12px; padding: 24px; border: 1px solid #edf2f7; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); .title { display: flex; align-items: center; justify-content: space-between; color: #718096; font-size: 14px; font-weight: 600; } .value { font-size: 28px; font-weight: 800; color: ${props => props.$color || '#2d3748'}; }`;

const TicketsGrid = styled.div`display: grid; gap: 16px;`;
const TicketCard = styled.div`background: white; border-radius: 12px; border: 1px solid #edf2f7; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; border-left: 4px solid ${props => props.$statusColor}; &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateX(4px); border-color: ${props => props.$statusColor}; }`;

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(2px);`;
const ModalContent = styled.div`background: white; padding: 32px; border-radius: 16px; width: 100%; max-width: 750px; max-height: 92vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; label { font-size: 13px; font-weight: 700; color: #4a5568; text-transform: uppercase; } input, select, textarea { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; &:focus { border-color: #3182ce; } }`;

// --- ESTILOS DO CHAT ---
const ChatContainer = styled.div`border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; height: 350px; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;`;
const ChatBubble = styled.div`max-width: 75%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; align-self: ${props => props.$isMe ? 'flex-end' : 'flex-start'}; background: ${props => props.$isMe ? '#3182ce' : 'white'}; color: ${props => props.$isMe ? 'white' : '#2d3748'}; border: ${props => props.$isMe ? 'none' : '1px solid #e2e8f0'}; box-shadow: 0 2px 4px rgba(0,0,0,0.02); .meta { font-size: 10px; font-weight: bold; margin-bottom: 4px; color: ${props => props.$isMe ? 'rgba(255,255,255,0.8)' : '#718096'}; text-transform: uppercase; }`;

// 🔥 O FETCHER QUE FALTAVA VOLTOU AQUI!
const fetcher = (url) => api.get(url).then(res => res.data);

export default function Helpdesk() {
  const { user, selectedCompany } = useAuth();
  const isClient = user?.role === 'CLIENT';

  // 1. INTEGRIDADE DE DADOS: Busca os clientes para encontrar o Dossiê correto do utilizador
  const clientsQuery = useMemo(() => {
    if (isClient && user?.companyAccessId) return `?companyId=${user.companyAccessId}`;
    if (!isClient && selectedCompany) return `?companyId=${selectedCompany.id}`;
    return null;
  }, [isClient, user, selectedCompany]);

  const { data: clients } = useSWR(clientsQuery ? `/clients${clientsQuery}` : null, fetcher);

  // 2. Encontra o ID do Cliente logado cruzando o e-mail
  const myClientRecord = useMemo(() => {
    if (!isClient || !clients) return null;
    return clients.find(c => c.email === user.email);
  }, [isClient, clients, user]);

  // 3. Monta a Query segura para os Chamados (Impede que um cliente veja os chamados do outro)
  const ticketQuery = useMemo(() => {
    if (!isClient && selectedCompany) return `?companyId=${selectedCompany.id}`;
    if (isClient && myClientRecord) return `?companyId=${user.companyAccessId}&clientId=${myClientRecord.id}`;
    return null;
  }, [isClient, selectedCompany, user, myClientRecord]);

const { data: tickets, mutate } = useSWR(ticketQuery ? `/tickets${ticketQuery}` : null, fetcher, { refreshInterval: 15000 });

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [form, setForm] = useState({ subject: '', department: 'Contábil', description: '', priority: 'NORMAL', clientId: '' });
  const [textMessage, setTextMessage] = useState('');
  
  const chatEndRef = useRef(null);

  // Mantém a janela do chat sempre sincronizada e rola para baixo
  useEffect(() => {
    if (selectedTicket && tickets) {
      const freshTicket = tickets.find(t => t.id === selectedTicket.id);
      if (freshTicket && freshTicket.messages?.length !== selectedTicket.messages?.length) {
        setSelectedTicket(freshTicket);
      }
    }
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [tickets, selectedTicket?.messages]);

  const summary = useMemo(() => {
    if (!tickets) return { abertos: 0, andamento: 0, resolvidos: 0 };
    return tickets.reduce((acc, t) => {
      if (t.status === 'ABERTO') acc.abertos++;
      else if (t.status === 'EM_ANDAMENTO') acc.andamento++;
      else if (t.status === 'RESOLVIDO') acc.resolvidos++;
      return acc;
    }, { abertos: 0, andamento: 0, resolvidos: 0 });
  }, [tickets]);

  async function handleCreateTicket(e) {
    e.preventDefault();
    
    if (isClient && !myClientRecord) {
      return toast.error("Erro: O seu e-mail não foi encontrado no cadastro de nenhuma empresa.");
    }
    if (!isClient && !selectedCompany) {
      return toast.error("Selecione uma empresa ativa no menu lateral.");
    }
    if (!isClient && !form.clientId) {
      return toast.error("Selecione um cliente para vincular o chamado.");
    }

    const tId = toast.loading("A processar a abertura do chamado...");
    try {
      const payload = {
        ...form,
        companyId: isClient ? user.companyAccessId : selectedCompany.id,
        clientId: isClient ? myClientRecord.id : form.clientId 
      };

      await api.post('/tickets', payload);
      toast.success("Solicitação aberta com sucesso!", { id: tId });
      setIsNewModalOpen(false);
      setForm({ subject: '', department: 'Contábil', description: '', priority: 'NORMAL', clientId: '' });
      mutate();
    } catch (err) {
      toast.error("Falha ao abrir chamado.", { id: tId });
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!textMessage.trim()) return;

    try {
      const payload = {
        message: textMessage,
        senderRole: isClient ? "CLIENT" : "ADMIN",
        senderName: user.name || "Usuário"
      };

      const { data: addedMessage } = await api.post(`/tickets/${selectedTicket.id}/messages`, payload);
      
      setSelectedTicket(prev => ({
        ...prev,
        messages: [...(prev.messages || []), addedMessage]
      }));

      setTextMessage('');
      mutate(); 
    } catch (err) {
      toast.error("Erro ao transmitir mensagem.");
    }
  }

  async function handleOpenTicket(t) {
    setSelectedTicket(t);
    
    // Verifica se este chamado tinha uma notificação para a pessoa logada
    const hasUnread = isClient ? t.hasUnreadClient : t.hasUnreadAdmin;
    
    if (hasUnread) {
      try {
        await api.put(`/tickets/${t.id}/read`, { role: user.role });
        mutate(); // Atualiza a tela para apagar a notificação visual
      } catch (error) {
        console.error("Erro ao marcar como lido");
      }
    }
  }

  async function handleUpdateStatus(newStatus) {
    try {
      await api.put(`/tickets/${selectedTicket.id}/status`, { status: newStatus });
      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      toast.success(`Status alterado para ${newStatus.replace('_', ' ')}`);
      mutate();
    } catch (err) {
      toast.error("Erro ao alterar status.");
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'ABERTO': return '#e53e3e';
      case 'EM_ANDAMENTO': return '#d69e2e';
      case 'RESOLVIDO': return '#38a169';
      default: return '#a0aec0';
    }
  };

  // 🔥 PROTEÇÃO VISUAL: Se for cliente mas não tiver o e-mail no CRM, bloqueia o ecrã.
  if (isClient && clients && !myClientRecord) {
    return (
      <Container>
        <Header><h1><LifeBuoy color="#3182ce" size={32} /> Central de Suporte</h1></Header>
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '1px solid #fed7d7' }}>
          <ShieldAlert size={48} color="#e53e3e" style={{ marginBottom: 16 }} />
          <h2 style={{ color: '#c53030', margin: '0 0 8px 0' }}>Acesso Pendente de Validação</h2>
          <p style={{ color: '#4a5568', margin: 0, fontSize: 16 }}>
            O seu e-mail de acesso (<strong>{user.email}</strong>) não foi encontrado no cadastro do escritório.<br/>
            Por favor, peça ao seu contador para atualizar o seu e-mail na aba <strong>Clientes (CRM)</strong>.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1><LifeBuoy color="#3182ce" size={32} /> Central de Suporte Contábil</h1>
        <ActionButton onClick={() => setIsNewModalOpen(true)}>
          <Plus size={18} /> Nova Solicitação
        </ActionButton>
      </Header>

      <CardsGrid>
        <StatCard>
          <div className="title">Aguardando Resposta <AlertCircle size={18} color="#e53e3e" /></div>
          <div className="value" style={{ color: '#e53e3e' }}>{summary.abertos}</div>
        </StatCard>
        <StatCard>
          <div className="title">Em Análise Técnica <Clock size={18} color="#d69e2e" /></div>
          <div className="value" style={{ color: '#d69e2e' }}>{summary.andamento}</div>
        </StatCard>
        <StatCard>
          <div className="title">Resolvidos / Arquivados <CheckCircle size={18} color="#38a169" /></div>
          <div className="value" style={{ color: '#38a169' }}>{summary.resolvidos}</div>
        </StatCard>
      </CardsGrid>

      {!tickets ? (
        <p style={{ color: '#a0aec0', textAlign: 'center', padding: 40 }}>A carregar chamados...</p>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '1px dashed #cbd5e0' }}>
          <MessageSquare size={48} color="#cbd5e0" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#4a5568', margin: '0 0 8px 0' }}>Nenhuma solicitação em andamento</h3>
          <p style={{ color: '#a0aec0', margin: 0 }}>O seu canal direto com a equipa contábil está limpo.</p>
        </div>
      ) : (
        <TicketsGrid>
          {tickets.map(t => (
            <TicketCard key={t.id} $statusColor={getStatusColor(t.status)} onClick={() => handleOpenTicket(t)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {(isClient ? t.hasUnreadClient : t.hasUnreadAdmin) && (
         <span style={{ width: 8, height: 8, background: '#e53e3e', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(229, 62, 62, 0.2)' }} title="Nova Mensagem" />
      )}
      <strong style={{ fontSize: 16, color: '#2d3748' }}>{t.subject}</strong>
                  <strong style={{ fontSize: 16, color: '#2d3748' }}>{t.subject}</strong>
                  <span style={{ fontSize: 11, fontWeight: 800, background: '#edf2f7', padding: '2px 8px', borderRadius: 12, color: '#4a5568' }}>{t.department}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#718096' }}>
                  {!isClient && t.client && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={14}/> {t.client.fullName}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14}/> Aberto em: {new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
                  <span style={{ fontWeight: 600, color: t.priority === 'URGENTE' ? '#e53e3e' : '#718096' }}>Prioridade: {t.priority}</span>
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 12, color: getStatusColor(t.status), background: `${getStatusColor(t.status)}15`, padding: '6px 12px', borderRadius: 8 }}>
                {t.status.replace('_', ' ')}
              </div>
            </TicketCard>
          ))}
        </TicketsGrid>
      )}

      {/* MODAL: NOVO CHAMADO */}
      {isNewModalOpen && (
        <ModalOverlay>
          <ModalContent style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 24, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare color="#3182ce" /> Detalhar Nova Solicitação</h2>
            <form onSubmit={handleCreateTicket}>
              
              {!isClient && (
                <FormGroup>
                  <label>Vincular a qual Cliente?</label>
                  <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required>
                    <option value="">Selecione a empresa alvo...</option>
                    {clients?.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </FormGroup>
              )}

              <FormGroup>
                <label>Assunto Principal / Título</label>
                <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required placeholder="Ex: Solicitação de Admissão - Funcionário Novo" />
              </FormGroup>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>Departamento Especializado</label>
                  <select value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    <option value="Contábil">Contábil</option>
                    <option value="Fiscal / Impostos">Fiscal / Impostos</option>
                    <option value="RH / Departamento Pessoal">RH / Pessoal</option>
                    <option value="Financeiro / BPO">Financeiro / BPO</option>
                    <option value="Outros">Outros</option>
                  </select>
                </FormGroup>
                <FormGroup>
                  <label>Nível de Gravidade</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="BAIXA">Baixa</option>
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">🚨 Urgente (Risco de Multa)</option>
                  </select>
                </FormGroup>
              </div>

              <FormGroup>
                <label>Mensagem e Instruções Detalhadas</label>
                <textarea rows="4" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="Digite todas as informações para que a equipa técnica possa prosseguir..." style={{ fontFamily: 'inherit' }} />
              </FormGroup>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setIsNewModalOpen(false)} style={{ background: '#edf2f7', color: '#4a5568', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ background: '#3182ce', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Send size={18} /> Protocolar Pedido</button>
              </div>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* MODAL DE CHAT INTERATIVO */}
      {selectedTicket && (
        <ModalOverlay>
          <ModalContent style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #edf2f7' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h2 style={{ margin: 0, color: '#2d3748', fontSize: 20 }}>{selectedTicket.subject}</h2>
                  <span style={{ fontSize: 11, fontWeight: 800, background: `${getStatusColor(selectedTicket.status)}15`, padding: '4px 10px', borderRadius: 12, color: getStatusColor(selectedTicket.status) }}>{selectedTicket.status.replace('_', ' ')}</span>
                </div>
                <div style={{ fontSize: 13, color: '#718096' }}>Departamento: <strong>{selectedTicket.department}</strong> • Gravidade: <strong>{selectedTicket.priority}</strong></div>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#a0aec0" /></button>
            </div>

            <div style={{ background: '#fffaf0', padding: 16, borderRadius: 8, border: '1px solid #feebc8', marginBottom: 20, fontSize: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 700, color: '#dd6b20' }}><ShieldAlert size={16}/> Contexto de Abertura do Chamado:</div>
              <p style={{ margin: 0, color: '#4a5568', whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</p>
            </div>

            <ChatContainer>
              {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                <p style={{ color: '#a0aec0', textAlign: 'center', margin: 'auto', fontSize: 13 }}>Nenhuma interação registada. Escreva uma mensagem abaixo para iniciar o diálogo.</p>
              ) : (
                selectedTicket.messages.map(m => {
                  const isMe = (isClient && m.senderRole === 'CLIENT') || (!isClient && m.senderRole === 'ADMIN');
                  return (
                    <ChatBubble key={m.id} $isMe={isMe}>
                      <div className="meta">{m.senderName} ({m.senderRole === 'ADMIN' ? 'Escritório' : 'Cliente'})</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                    </ChatBubble>
                  );
                })
              )}
              {/* Elemento âncora para o Auto-Scroll */}
              <div ref={chatEndRef} />
            </ChatContainer>

            <div style={{ display: 'grid', gridTemplateColumns: isClient ? '1fr' : '220px 1fr', gap: 16, alignItems: 'center', background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              
              {!isClient && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRight: '1px solid #e2e8f0', paddingRight: 16 }}>
                  <span style={{ fontWeight: 700, color: '#4a5568', fontSize: 12, textTransform: 'uppercase' }}>Status:</span>
                  <select 
                    value={selectedTicket.status} 
                    onChange={e => handleUpdateStatus(e.target.value)} 
                    style={{ padding: '8px', borderRadius: 6, border: '1px solid #cbd5e0', fontSize: 13, background: 'white', fontWeight: 600 }}
                  >
                    <option value="ABERTO">🔴 Aberto</option>
                    <option value="EM_ANDAMENTO">🟡 Em Análise</option>
                    <option value="RESOLVIDO">🟢 Resolvido</option>
                  </select>
                </div>
              )}

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12, width: '100%' }}>
                <input 
                  value={textMessage}
                  onChange={e => setTextMessage(e.target.value)}
                  placeholder="Escreva uma orientação técnica ou responda à equipa..."
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e0', outline: 'none', fontSize: 14 }}
                />
                <button type="submit" style={{ background: '#3182ce', color: 'white', border: 'none', padding: '0 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={18} />
                </button>
              </form>

            </div>

          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}