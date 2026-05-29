import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LifeBuoy, Plus, MessageSquare, Clock, CheckCircle, 
  AlertCircle, Send, User, Building2, Search, X
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';

// --- ESTILOS ---
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const Container = styled.div`width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.4s ease;`;
const Header = styled.header`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; h1 { font-size: 26px; color: #1a202c; font-weight: 800; display: flex; align-items: center; gap: 12px; }`;
const ActionButton = styled.button`display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; background: #3182ce; color: white; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2); &:hover { background: #2c5282; transform: translateY(-2px); }`;

const CardsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 32px;`;
const StatCard = styled.div`background: white; border-radius: 12px; padding: 24px; border: 1px solid #edf2f7; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); .title { display: flex; align-items: center; justify-content: space-between; color: #718096; font-size: 14px; font-weight: 600; } .value { font-size: 28px; font-weight: 800; color: ${props => props.$color || '#2d3748'}; }`;

const TicketsGrid = styled.div`display: grid; gap: 16px;`;
const TicketCard = styled.div`background: white; border-radius: 12px; border: 1px solid #edf2f7; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; border-left: 4px solid ${props => props.$statusColor}; &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateX(4px); border-color: ${props => props.$statusColor}; }`;

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(2px);`;
const ModalContent = styled.div`background: white; padding: 32px; border-radius: 16px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; label { font-size: 13px; font-weight: 700; color: #4a5568; text-transform: uppercase; } input, select, textarea { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; &:focus { border-color: #3182ce; } }`;

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Helpdesk() {
  const { user, selectedCompany } = useAuth();
  const isClient = user?.role === 'CLIENT';

  // O cliente tem o seu próprio ID, a agência usa o companyId para ver todos
  const query = selectedCompany ? `?companyId=${selectedCompany.id}` : '';
  const { data: tickets, mutate } = useSWR(`/tickets${query}`, fetcher);
  
  // Buscar clientes para o select (apenas para a Agência, caso queira abrir chamado em nome do cliente)
  const { data: clients } = useSWR(!isClient && selectedCompany ? '/clients' : null, fetcher);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [form, setForm] = useState({ subject: '', department: 'Contábil', description: '', priority: 'NORMAL', clientId: '' });
  const [replyText, setReplyText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

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
    if (!selectedCompany && !isClient) return toast.error("Selecione uma empresa ativa primeiro.");
    
    const tId = toast.loading("A abrir chamado...");
    try {
      const payload = {
        ...form,
        companyId: isClient ? user.companyAccessId : selectedCompany.id,
        // Se for cliente, usa o ID da empresa dele. Se for agência, usa o ID que escolheu no select
        clientId: isClient ? user.companyAccessId : form.clientId 
      };

      await api.post('/tickets', payload);
      toast.success("Chamado enviado com sucesso!", { id: tId });
      setIsNewModalOpen(false);
      setForm({ subject: '', department: 'Contábil', description: '', priority: 'NORMAL', clientId: '' });
      mutate();
    } catch (err) {
      toast.error("Erro ao abrir chamado.", { id: tId });
    }
  }

  async function handleReplyTicket(e) {
    e.preventDefault();
    const tId = toast.loading("A atualizar chamado...");
    try {
      await api.put(`/tickets/${selectedTicket.id}`, {
        status: statusUpdate || selectedTicket.status,
        reply: replyText || selectedTicket.reply
      });
      toast.success("Atualizado!", { id: tId });
      setSelectedTicket(null);
      setReplyText('');
      setStatusUpdate('');
      mutate();
    } catch (err) {
      toast.error("Erro ao atualizar.", { id: tId });
    }
  }

  function openTicketDetails(t) {
    setSelectedTicket(t);
    setReplyText(t.reply || '');
    setStatusUpdate(t.status);
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'ABERTO': return '#e53e3e'; // Vermelho
      case 'EM_ANDAMENTO': return '#d69e2e'; // Amarelo
      case 'RESOLVIDO': return '#38a169'; // Verde
      default: return '#a0aec0';
    }
  };

  return (
    <Container>
      <Header>
        <h1><LifeBuoy color="#3182ce" size={32} /> Central de Atendimento</h1>
        <ActionButton onClick={() => setIsNewModalOpen(true)}>
          <Plus size={18} /> Novo Chamado
        </ActionButton>
      </Header>

      <CardsGrid>
        <StatCard>
          <div className="title">Aguardando Resposta <AlertCircle size={18} color="#e53e3e" /></div>
          <div className="value" style={{ color: '#e53e3e' }}>{summary.abertos}</div>
        </StatCard>
        <StatCard>
          <div className="title">Em Análise <Clock size={18} color="#d69e2e" /></div>
          <div className="value" style={{ color: '#d69e2e' }}>{summary.andamento}</div>
        </StatCard>
        <StatCard>
          <div className="title">Resolvidos <CheckCircle size={18} color="#38a169" /></div>
          <div className="value" style={{ color: '#38a169' }}>{summary.resolvidos}</div>
        </StatCard>
      </CardsGrid>

      {!tickets ? (
        <p style={{ color: '#a0aec0', textAlign: 'center', padding: 40 }}>A carregar chamados...</p>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '1px dashed #cbd5e0' }}>
          <MessageSquare size={48} color="#cbd5e0" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#4a5568', margin: '0 0 8px 0' }}>Nenhum chamado em aberto</h3>
          <p style={{ color: '#a0aec0', margin: 0 }}>Precisa de ajuda? Clique em "Novo Chamado".</p>
        </div>
      ) : (
        <TicketsGrid>
          {tickets.map(t => (
            <TicketCard key={t.id} $statusColor={getStatusColor(t.status)} onClick={() => openTicketDetails(t)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <strong style={{ fontSize: 16, color: '#2d3748' }}>{t.subject}</strong>
                  <span style={{ fontSize: 11, fontWeight: 800, background: '#edf2f7', padding: '2px 8px', borderRadius: 12, color: '#4a5568' }}>{t.department}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#718096' }}>
                  {!isClient && t.client && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={14}/> {t.client.fullName}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14}/> {new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
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
            <h2 style={{ marginBottom: 24, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare color="#3182ce" /> Abrir Chamado</h2>
            <form onSubmit={handleCreateTicket}>
              
              {!isClient && (
                <FormGroup>
                  <label>Vincular Cliente (Opcional)</label>
                  <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
                    <option value="">Selecione para qual cliente é este chamado...</option>
                    {clients?.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </FormGroup>
              )}

              <FormGroup>
                <label>Assunto Principal</label>
                <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required placeholder="Ex: Dúvida sobre Férias" />
              </FormGroup>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>Departamento</label>
                  <select value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    <option value="Contábil">Contábil</option>
                    <option value="Fiscal / Impostos">Fiscal / Impostos</option>
                    <option value="RH / Departamento Pessoal">RH / Pessoal</option>
                    <option value="Financeiro / BPO">Financeiro / BPO</option>
                    <option value="Outros">Outros</option>
                  </select>
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
                <label>Descrição do Pedido</label>
                <textarea rows="4" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="Descreva em detalhe o que necessita..." style={{ fontFamily: 'inherit' }} />
              </FormGroup>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setIsNewModalOpen(false)} style={{ background: '#edf2f7', color: '#4a5568', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ background: '#3182ce', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Send size={18} /> Enviar Pedido</button>
              </div>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* MODAL: VER/RESPONDER CHAMADO */}
      {selectedTicket && (
        <ModalOverlay>
          <ModalContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #edf2f7' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h2 style={{ margin: 0, color: '#2d3748' }}>{selectedTicket.subject}</h2>
                  <span style={{ fontSize: 11, fontWeight: 800, background: `${getStatusColor(selectedTicket.status)}15`, padding: '4px 10px', borderRadius: 12, color: getStatusColor(selectedTicket.status) }}>{selectedTicket.status.replace('_', ' ')}</span>
                </div>
                <div style={{ fontSize: 13, color: '#718096' }}>Departamento: <strong>{selectedTicket.department}</strong> • Prioridade: <strong>{selectedTicket.priority}</strong></div>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#a0aec0" /></button>
            </div>

            {/* MENSAGEM DO CLIENTE */}
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#4a5568', fontWeight: 700 }}>
                <User size={18} /> Mensagem Original {selectedTicket.client && `(${selectedTicket.client.fullName})`}
              </div>
              <p style={{ margin: 0, color: '#2d3748', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</p>
            </div>

            {/* RESPOSTA DO CONTADOR */}
            <form onSubmit={handleReplyTicket}>
              <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '2px solid #ebf8ff', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#3182ce', fontWeight: 700 }}>
                  <Building2 size={18} /> Resposta do Escritório
                </div>
                
                <textarea 
                  rows="4" 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)} 
                  disabled={isClient} // O cliente só lê a resposta, não a edita!
                  placeholder={isClient ? "A aguardar análise do contador..." : "Digite a sua resposta técnica aqui..."}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'inherit', background: isClient ? '#f7fafc' : 'white', resize: 'vertical' }} 
                />
              </div>

              {!isClient && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f7fafc', padding: 16, borderRadius: 12, border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 600, color: '#4a5568', fontSize: 14 }}>Atualizar Status:</span>
                    <select value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e0', outline: 'none' }}>
                      <option value="ABERTO">🔴 Aberto</option>
                      <option value="EM_ANDAMENTO">🟡 Em Andamento</option>
                      <option value="RESOLVIDO">🟢 Resolvido</option>
                    </select>
                  </div>
                  <button type="submit" style={{ background: '#3182ce', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Send size={18} /> Salvar e Enviar Resposta</button>
                </div>
              )}
            </form>

          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}