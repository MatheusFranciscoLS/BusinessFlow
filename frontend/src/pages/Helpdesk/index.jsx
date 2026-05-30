import React, { useState, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

// 🔥 LIMPEZA: CheckCircle removido. ShieldAlert agora será usado para a tela de bloqueio!
import { 
  LifeBuoy, Plus, MessageSquare, Clock, 
  AlertCircle, Send, User, Building2, X, ShieldAlert 
} from 'lucide-react';

import {
  Container, Header, ActionButton, Layout, Sidebar, 
  TicketCard, Badge, ChatArea, MessageBubble, 
  ModalOverlay, ModalContent, FormGroup
} from './styles';

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Helpdesk() {
  const { user, selectedCompany } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const queryCompany = isClient ? user.companyAccessId : selectedCompany?.id;

  const queryParams = queryCompany 
    ? `?companyId=${queryCompany}&role=${user?.role}&userEmail=${user?.email}` 
    : null;

  const { data: clients } = useSWR(!isClient && queryCompany ? `/clients?companyId=${queryCompany}` : null, fetcher);
  const { data: tickets, mutate } = useSWR(queryParams ? `/tickets${queryParams}` : null, fetcher, { refreshInterval: 5000 });

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [textMessage, setTextMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const [form, setForm] = useState({ subject: '', department: 'Fiscal e Tributário', description: '', priority: 'NORMAL', clientId: '' });

  // Dossiê do cliente logado (Para a trava de segurança)
  const myClientRecord = useMemo(() => {
    if (!isClient || !clients) return null;
    return clients.find(c => c.email === user.email);
  }, [isClient, clients, user]);

  const selectedTicket = useMemo(() => {
    if (!tickets || !selectedTicketId) return null;
    return tickets.find(t => t.id === selectedTicketId);
  }, [tickets, selectedTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  useEffect(() => {
    if (selectedTicket) {
      const isUnread = isClient ? selectedTicket.hasUnreadClient : selectedTicket.hasUnreadAdmin;
      if (isUnread) {
        api.put(`/tickets/${selectedTicket.id}/read`, { role: user.role })
           .then(() => mutate());
      }
    }
  }, [selectedTicketId, selectedTicket, isClient, user.role, mutate]);

  async function handleCreateTicket(e) {
    e.preventDefault();
    if (!isClient && !form.clientId) return toast.error("Selecione um cliente.");

    const tId = toast.loading("A abrir chamado...");
    try {
      const payload = {
        ...form,
        companyId: queryCompany,
        clientId: isClient ? (tickets?.[0]?.clientId || "") : form.clientId, 
        role: user.role
      };

      if (isClient && !payload.clientId) {
         if(myClientRecord) payload.clientId = myClientRecord.id;
      }

      await api.post('/tickets', payload);
      toast.success("Chamado aberto com sucesso!", { id: tId });
      setIsModalOpen(false);
      setForm({ subject: '', department: 'Fiscal e Tributário', description: '', priority: 'NORMAL', clientId: '' });
      mutate();
    } catch (err) { toast.error("Erro ao criar chamado.", { id: tId }); }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!textMessage.trim() || !selectedTicketId) return;

    try {
      const msg = textMessage;
      setTextMessage('');
      await api.post(`/tickets/${selectedTicketId}/messages`, {
        message: msg,
        senderRole: user.role,
        senderName: user.name
      });
      mutate();
    } catch (err) { toast.error("Erro ao enviar mensagem."); }
  }

  async function handleUpdateStatus(newStatus) {
    try {
      await api.put(`/tickets/${selectedTicketId}/status`, { status: newStatus });
      toast.success("Status atualizado!");
      mutate();
    } catch (err) { toast.error("Erro ao atualizar status."); }
  }

  // 🔥 PROTEÇÃO VISUAL: Bloqueia a tela se o dossiê ainda não existir no CRM do Escritório!
  if (isClient && clients && !myClientRecord && !tickets) {
    return (
      <Container style={{ textAlign: 'center', padding: 60 }}>
        <ShieldAlert size={48} color="#e53e3e" style={{ marginBottom: 16 }} />
        <h2>Acesso Pendente</h2>
        <p>A sua conta está a ser configurada. Fale com o seu contador.</p>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1><LifeBuoy color="#3182ce" size={32} /> Central de Atendimento (Helpdesk)</h1>
        <ActionButton onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Chamado
        </ActionButton>
      </Header>

      {!tickets ? (
        <p style={{ color: '#a0aec0', textAlign: 'center' }}>Carregando chamados...</p>
      ) : (
        <Layout>
          {/* PAINEL ESQUERDO: Lista de Tickets */}
          <Sidebar>
            <div style={{ padding: '20px', borderBottom: '1px solid #edf2f7', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={18} /> Meus Chamados
              </h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {tickets.length === 0 ? (
                <p style={{ padding: 20, textAlign: 'center', color: '#a0aec0', fontSize: 14 }}>Nenhum chamado aberto.</p>
              ) : (
                tickets.map(ticket => {
                  const isUnread = isClient ? ticket.hasUnreadClient : ticket.hasUnreadAdmin;
                  return (
                    <TicketCard 
                      key={ticket.id} 
                      $active={selectedTicketId === ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Badge $status={ticket.status}>{ticket.status}</Badge>
                        <span style={{ fontSize: 12, color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 15, color: '#2d3748', fontWeight: isUnread ? 800 : 600 }}>
                        {ticket.subject}
                      </h4>
                      {!isClient && ticket.client && (
                        <div style={{ fontSize: 12, color: '#718096', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                          <Building2 size={12} /> {ticket.client.fullName}
                        </div>
                      )}
                      {isUnread && (
                        <div style={{ width: 8, height: 8, background: '#e53e3e', borderRadius: '50%', marginTop: 8 }} />
                      )}
                    </TicketCard>
                  );
                })
              )}
            </div>
          </Sidebar>

          {/* PAINEL DIREITO: Área de Chat */}
          <ChatArea>
            {!selectedTicket ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>
                <MessageSquare size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p>Selecione um chamado para ver as mensagens</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '20px', borderBottom: '1px solid #edf2f7', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#2d3748' }}>{selectedTicket.subject}</h2>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#718096' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={14} /> Prioridade: {selectedTicket.priority}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} /> Departamento: {selectedTicket.department}</span>
                    </div>
                  </div>
                  {/* O "X" agora está disponível tanto para o Cliente quanto para o Gestor fecharem a conversa no mobile/tablet! */}
                  <button onClick={() => setSelectedTicketId(null)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#a0aec0' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Área de rolagem do chat */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: '#fcfcfc' }}>
                  <MessageBubble $isMine={isClient}>
                    <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4, opacity: 0.8 }}>
                      {isClient ? 'Você' : selectedTicket.client?.fullName}
                    </div>
                    {selectedTicket.description}
                  </MessageBubble>

                  {selectedTicket.messages.map(msg => {
                    const isMine = msg.senderRole === user.role;
                    return (
                      <MessageBubble key={msg.id} $isMine={isMine}>
                        <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4, opacity: 0.8 }}>
                          {isMine ? 'Você' : msg.senderName}
                        </div>
                        {msg.message}
                      </MessageBubble>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Área de envio de mensagem */}
                <div style={{ padding: '20px', borderTop: '1px solid #edf2f7', background: 'white', display: 'flex', gap: 16, alignItems: 'center' }}>
                  
                  {!isClient && (
                    <select 
                      value={selectedTicket.status} 
                      onChange={e => handleUpdateStatus(e.target.value)} 
                      style={{ padding: '12px', borderRadius: 8, border: '1px solid #cbd5e0', fontSize: 14, background: '#f7fafc', fontWeight: 600, outline: 'none' }}
                    >
                      <option value="ABERTO">🔴 Aberto</option>
                      <option value="EM_ANDAMENTO">🟡 Em Análise</option>
                      <option value="RESOLVIDO">🟢 Resolvido</option>
                    </select>
                  )}

                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <input 
                      value={textMessage}
                      onChange={e => setTextMessage(e.target.value)}
                      placeholder="Escreva a sua mensagem..."
                      style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14 }}
                    />
                    <button type="submit" disabled={selectedTicket.status === 'RESOLVIDO'} style={{ background: selectedTicket.status === 'RESOLVIDO' ? '#a0aec0' : '#3182ce', color: 'white', border: 'none', padding: '0 24px', borderRadius: 8, cursor: selectedTicket.status === 'RESOLVIDO' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, transition: '0.2s' }}>
                      <Send size={18} /> Enviar
                    </button>
                  </form>
                </div>
              </>
            )}
          </ChatArea>
        </Layout>
      )}

      {/* MODAL NOVO CHAMADO */}
      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#2d3748' }}>
              <LifeBuoy color="#3182ce" /> Abrir Novo Chamado
            </h2>
            <form onSubmit={handleCreateTicket}>
              
              {!isClient && (
                <FormGroup>
                  <label>Cliente Solicitante *</label>
                  <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required>
                    <option value="">Selecione o cliente...</option>
                    {clients?.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </FormGroup>
              )}

              <FormGroup>
                <label>Assunto do Chamado *</label>
                <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required placeholder="Ex: Dúvida sobre emissão de NF" />
              </FormGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>Departamento</label>
                  <select value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    <option value="Fiscal e Tributário">Fiscal e Tributário</option>
                    <option value="Contábil">Contábil</option>
                    <option value="DP e RH">Departamento Pessoal (RH)</option>
                    <option value="Legal e Societário">Legal e Societário</option>
                    <option value="Outros">Outros</option>
                  </select>
                </FormGroup>
                <FormGroup>
                  <label>Prioridade</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta (Urgente)</option>
                  </select>
                </FormGroup>
              </div>

              <FormGroup>
                <label>Descrição do Pedido *</label>
                <textarea rows="4" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descreva com detalhes o que precisa..." style={{ fontFamily: 'inherit' }} />
              </FormGroup>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#edf2f7', color: '#4a5568', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ background: '#3182ce', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Abrir Chamado</button>
              </div>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}