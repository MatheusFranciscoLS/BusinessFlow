import React, { useState } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, CheckCircle, Plus, Trash2, Check, X, User } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

// ----------------------------------------------------------------------
// 🎨 ESTILOS LOCAIS & SKELETONS (Garante que a tela não quebre)
// ----------------------------------------------------------------------
const Container = styled.div`width: 100%; padding-bottom: 40px;`;
const Header = styled.header`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; h1 { font-size: 26px; color: #1a202c; font-weight: 800; }`;
const ActionButton = styled.button`display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; background: #3182ce; color: white; &:hover { background: #2c5282; }`;

const CardsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 40px;`;
const StatCard = styled.div`background: white; border-radius: 12px; padding: 24px; border: 1px solid #edf2f7; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); .title { display: flex; align-items: center; justify-content: space-between; color: #718096; font-size: 14px; font-weight: 600; } .value { font-size: 28px; font-weight: 800; color: ${props => props.$color || '#2d3748'}; }`;

const ApptGroup = styled.div`margin-bottom: 32px;`;
const DateHeader = styled.h3`font-size: 13px; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;`;
const ApptCard = styled.div`display: flex; background: white; border-radius: 12px; border: 1px solid #edf2f7; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: 0.2s; border-left: 4px solid ${props => props.$status === 'concluido' ? '#48bb78' : props.$status === 'cancelado' ? '#f56565' : '#ecc94b'}; @media (max-width: 600px) { flex-direction: column; }`;
const TimeSection = styled.div`padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f7fafc; border-right: 1px solid #edf2f7; min-width: 100px; strong { font-size: 18px; color: #2d3748; } span { font-size: 11px; color: #718096; text-transform: uppercase; font-weight: 600; margin-top: 4px; } @media (max-width: 600px) { border-right: none; border-bottom: 1px solid #edf2f7; flex-direction: row; gap: 8px; padding: 12px; }`;
const InfoSection = styled.div`padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: center; .name { font-size: 16px; font-weight: 700; color: #2d3748; margin-bottom: 4px; } .phone { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #718096; margin-bottom: 12px; } .notes { background: #f7fafc; padding: 10px; border-radius: 8px; font-size: 13px; color: #4a5568; font-style: italic; border: 1px solid #edf2f7; }`;
const ActionSection = styled.div`padding: 20px; display: flex; align-items: flex-end; justify-content: space-between; flex-direction: column; min-width: 140px; border-left: 1px solid #edf2f7; @media (max-width: 600px) { flex-direction: row; border-left: none; border-top: 1px solid #edf2f7; padding: 12px 20px; }`;
const StatusBadge = styled.span`padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: ${props => props.$status === 'concluido' ? '#e6fffa' : props.$status === 'cancelado' ? '#fff5f5' : '#fffff0'}; color: ${props => props.$status === 'concluido' ? '#319795' : props.$status === 'cancelado' ? '#e53e3e' : '#d69e2e'};`;

// Estilos do Modal
const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;`;
const ModalContent = styled.div`background: white; padding: 32px; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; label { font-size: 14px; font-weight: 600; color: #4a5568; } input, select, textarea { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; &:focus { border-color: #3182ce; } }`;
const ModalActions = styled.div`display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; button { padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; border: none; } .cancel { background: #edf2f7; color: #4a5568; &:hover { background: #e2e8f0; } } .save { background: #3182ce; color: white; &:hover { background: #2c5282; } }`;

// Animação Shimmer (Skeleton)
const shimmer = keyframes`0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; }`;
const SkeletonCard = styled.div`height: 120px; width: 100%; border-radius: 12px; background: #f0f0f0; background-image: linear-gradient(90deg, #f0f0f0 0px, #fafafa 150px, #f0f0f0 300px); background-size: 1000px 100%; animation: ${shimmer} 2s infinite linear;`;
const SkeletonRow = styled.div`height: 140px; width: 100%; border-radius: 12px; margin-bottom: 16px; background: #f0f0f0; background-image: linear-gradient(90deg, #f0f0f0 0px, #fafafa 150px, #f0f0f0 300px); background-size: 1000px 100%; animation: ${shimmer} 2s infinite linear;`;

// ----------------------------------------------------------------------
// 🚀 LÓGICA PRINCIPAL (SWR & Funções)
// ----------------------------------------------------------------------
const fetcher = (url) => api.get(url).then((res) => res.data);

export default function Appointments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ clientId: '', date: '', time: '', notes: '' });

  // 🔥 SWR: O Cérebro Fotográfico (Busca a Agenda e os Clientes ao mesmo tempo)
  const { data: appointments, error: errorAppts, mutate: mutateAppts } = useSWR('/appointments', fetcher);
  const { data: clients } = useSWR('/clients', fetcher);

  // Formatação de Telefone
  function formatPhone(phone) {
    if (!phone) return 'Sem contato';
    const p = phone.replace(/\D/g, ''); 
    if (p.length === 11) return p.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    if (p.length === 10) return p.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    return phone;
  }

  // Ações do Agendamento
  async function handleStatusChange(id, newStatus) {
    const tId = toast.loading('A atualizar...');
    try {
      await api.put(`/appointments/${id}`, { status: newStatus });
      toast.success('Status atualizado!', { id: tId });
      mutateAppts(); // Recarrega instantaneamente na tela
    } catch (err) {
      toast.error('Erro ao atualizar status.', { id: tId });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este agendamento?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Agendamento removido!');
      mutateAppts(); // Recarrega instantaneamente na tela
    } catch (err) {
      toast.error('Erro ao remover.');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.clientId || !form.date || !form.time) return toast.error('Preencha os campos obrigatórios!');
    
    const tId = toast.loading('A agendar...');
    try {
      const dateTime = new Date(`${form.date}T${form.time}:00`).toISOString();
      await api.post('/appointments', {
        clientId: form.clientId,
        date: dateTime,
        notes: form.notes,
        status: 'pendente'
      });
      toast.success('Agendamento criado!', { id: tId });
      setIsModalOpen(false);
      setForm({ clientId: '', date: '', time: '', notes: '' });
      mutateAppts(); // Atualiza a lista na hora
    } catch (err) {
      toast.error('Erro ao criar agendamento.', { id: tId });
    }
  }

  // ----------------------------------------------------------------------
  // ⏳ ESTADO DE CARREGAMENTO (Skeletons)
  // ----------------------------------------------------------------------
  if (errorAppts) return <div style={{ padding: 40, color: 'red' }}>Erro ao carregar a agenda.</div>;

  if (!appointments) {
    return (
      <Container>
        <Header><h1>Agenda</h1></Header>
        <CardsGrid><SkeletonCard /><SkeletonCard /><SkeletonCard /></CardsGrid>
        <div style={{ marginTop: 40 }}><SkeletonRow /><SkeletonRow /></div>
      </Container>
    );
  }

  // ----------------------------------------------------------------------
  // 📊 PROCESSAMENTO DE DADOS E AGRUPAMENTO
  // ----------------------------------------------------------------------
  const todayISO = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter(a => a.date.startsWith(todayISO)).length;
  const pendingCount = appointments.filter(a => a.status === 'pendente').length;
  const completedCount = appointments.filter(a => a.status === 'concluido').length;

  // Agrupa os agendamentos pelo Dia (Ex: 2026-05-07)
  const groupedByDate = appointments.reduce((acc, app) => {
    const dateStr = app.date.split('T')[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(app);
    return acc;
  }, {});

  // Ordena as datas cronologicamente (da mais antiga/hoje para o futuro)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b));

  return (
    <Container>
      <Header>
        <h1>Agenda</h1>
        <ActionButton onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Agendamento
        </ActionButton>
      </Header>

      <CardsGrid>
        <StatCard>
          <div className="title">Agendados para Hoje <Calendar size={18} color="#3182ce" /></div>
          <div className="value">{todayCount}</div>
        </StatCard>
        <StatCard>
          <div className="title">Compromissos Pendentes <Clock size={18} color="#d69e2e" /></div>
          <div className="value" style={{ color: '#d69e2e' }}>{pendingCount}</div>
        </StatCard>
        <StatCard>
          <div className="title">Atendimentos Concluídos <CheckCircle size={18} color="#48bb78" /></div>
          <div className="value" style={{ color: '#48bb78' }}>{completedCount}</div>
        </StatCard>
      </CardsGrid>

      {sortedDates.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#a0aec0', marginTop: 40 }}>Nenhum agendamento encontrado.</p>
      ) : (
        sortedDates.map(dateKey => {
          // Converte '2026-05-07' para 'QUINTA-FEIRA, 7 DE MAIO'
          const dateObj = new Date(dateKey + 'T12:00:00'); 
          const formattedDate = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
          
          return (
            <ApptGroup key={dateKey}>
              <DateHeader>{formattedDate}</DateHeader>
              
              {groupedByDate[dateKey].map(app => {
                const timeStr = new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <ApptCard key={app.id} $status={app.status}>
                    <TimeSection>
                      <strong>{timeStr}</strong>
                      <span>Hora</span>
                    </TimeSection>
                    
                    <InfoSection>
                      <div className="name">{app.client?.fullName || 'Cliente Removido'}</div>
                      <div className="phone"><User size={14} /> {formatPhone(app.client?.phone)}</div>
                      {app.notes && <div className="notes">{app.notes}</div>}
                    </InfoSection>
                    
                    <ActionSection>
                      <StatusBadge $status={app.status}>{app.status}</StatusBadge>
                      
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        {app.status === 'pendente' && (
                          <>
                            <button onClick={() => handleStatusChange(app.id, 'concluido')} style={{ background: 'none', border: 'none', color: '#48bb78', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}><Check size={16} /> Concluir</button>
                            <button onClick={() => handleStatusChange(app.id, 'cancelado')} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}><X size={16} /> Cancelar</button>
                          </>
                        )}
                        <button onClick={() => handleDelete(app.id)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </div>
                    </ActionSection>
                  </ApptCard>
                );
              })}
            </ApptGroup>
          );
        })
      )}

      {/* MODAL DE NOVO AGENDAMENTO */}
      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2 style={{ marginBottom: 24, color: '#1a202c' }}>Novo Agendamento</h2>
            <form onSubmit={handleSave}>
              <FormGroup>
                <label>Cliente</label>
                <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required>
                  <option value="">Selecione...</option>
                  {clients?.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </FormGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>Data</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </FormGroup>
                <FormGroup>
                  <label>Hora</label>
                  <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} required />
                </FormGroup>
              </div>

              <FormGroup>
                <label>Observações</label>
                <textarea rows="3" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Ex: Reunião de alinhamento..." />
              </FormGroup>

              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Agendar</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}