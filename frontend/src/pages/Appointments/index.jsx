import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, User, Check, X, Trash2, Clock } from 'lucide-react';
import { 
  Container, Header, DateGroup, Grid, AppointmentCard, 
  ModalOverlay, ModalContent, FormGroup, ModalActions 
} from './styles';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  async function loadData() {
    try {
      const [appRes, cliRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/clients')
      ]);
      setAppointments(appRes.data);
      setClients(cliRes.data);
    } catch (error) {
      console.error("Erro ao carregar", error);
    }
  }

  useEffect(() => { loadData(); }, []);

  // --- AGRUPAR POR DATA (A Mágica do UX) ---
  const groupedAppointments = appointments.reduce((groups, app) => {
    const dateKey = new Date(app.date).toLocaleDateString('pt-BR', { 
      weekday: 'long', day: 'numeric', month: 'long' 
    }); // Ex: "segunda-feira, 25 de novembro"
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(app);
    return groups;
  }, {});

  async function handleSave(e) {
    e.preventDefault();
    const toastId = toast.loading('Agendando...');
    try {
      const dateTime = new Date(`${date}T${time}:00`);
      await api.post('/appointments', { clientId, date: dateTime.toISOString(), notes });
      
      setIsModalOpen(false);
      loadData();
      setClientId(''); setDate(''); setTime(''); setNotes('');
      toast.success("Agendamento criado!", { id: toastId });
    } catch { toast.error("Erro ao agendar.", { id: toastId }); }
  }

  async function updateStatus(id, newStatus) {
    try {
      await api.put(`/appointments/${id}`, { status: newStatus });
      loadData();
      toast.success(newStatus === 'concluido' ? "Concluído!" : "Cancelado.");
    } catch { toast.error("Erro ao atualizar."); }
  }

  async function handleDelete(id) {
    if(window.confirm("Remover da lista?")) {
      try {
        await api.delete(`/appointments/${id}`);
        loadData();
        toast.success("Removido.");
      } catch { toast.error("Erro ao remover."); }
    }
  }

  function formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <Container>
      <Header>
        <h1>Agenda</h1>
        <button onClick={() => setIsModalOpen(true)}><Plus size={20} /> Novo Agendamento</button>
      </Header>

      {/* Renderiza os grupos de datas */}
      {Object.keys(groupedAppointments).length === 0 ? (
        <p style={{textAlign:'center', color:'#a0aec0', marginTop: 40}}>Nenhum agendamento encontrado.</p>
      ) : (
        Object.keys(groupedAppointments).map(dateKey => (
          <DateGroup key={dateKey}>
            <h3>{dateKey}</h3>
            <Grid>
              {groupedAppointments[dateKey].map(app => (
                <AppointmentCard key={app.id} $status={app.status}>
                  <div className="info">
                    <div className="time">
                      <strong>{formatTime(app.date)}</strong>
                      <span>Hora</span>
                    </div>
                    <div className="details">
                      <h4>{app.client?.fullName || 'Cliente sem nome'}</h4>
                      <p><User size={14} /> {app.client?.phone || 'Sem contato'}</p>
                      {app.notes && <p className="note">"{app.notes}"</p>}
                    </div>
                  </div>

                  <div className="actions">
                    {app.status === 'pendente' ? (
                      <>
                        <button className="check" onClick={() => updateStatus(app.id, 'concluido')}>
                          <Check size={16} /> Concluir
                        </button>
                        <button className="cancel" onClick={() => updateStatus(app.id, 'cancelado')}>
                          <X size={16} /> Cancelar
                        </button>
                      </>
                    ) : (
                      <span className={`badge ${app.status === 'concluido' ? 'done' : 'canceled'}`}>
                        {app.status}
                      </span>
                    )}
                    
                    <button className="delete" onClick={() => handleDelete(app.id)} title="Excluir permanentemente">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </AppointmentCard>
              ))}
            </Grid>
          </DateGroup>
        ))
      )}

      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>Novo Agendamento</h2>
            <form onSubmit={handleSave}>
              <FormGroup>
                <label>Cliente</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </FormGroup>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
                <FormGroup><label>Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></FormGroup>
                <FormGroup><label>Hora</label><input type="time" value={time} onChange={e => setTime(e.target.value)} required /></FormGroup>
              </div>
              <FormGroup><label>Observações</label><textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)} /></FormGroup>
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