import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Users, Building, DollarSign, Search, Plus, Edit, Trash2, 
  ShieldCheck, AlertCircle, FileText, Phone 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styled, { keyframes } from 'styled-components';

// --- ESTILOS ---
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const Container = styled.div`width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.4s ease;`;
const Header = styled.header`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; h1 { font-size: 26px; color: #1a202c; font-weight: 800; }`;
const ActionButton = styled.button`display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; background: #3182ce; color: white; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2); &:hover { background: #2c5282; transform: translateY(-2px); }`;
const SearchContainer = styled.div`display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 16px; flex: 1; min-width: 300px; height: 48px; input { border: none; outline: none; padding: 12px; width: 100%; font-size: 15px; background: transparent; }`;

const CardsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 32px;`;
const StatCard = styled.div`background: white; border-radius: 12px; padding: 24px; border: 1px solid #edf2f7; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); .title { display: flex; align-items: center; justify-content: space-between; color: #718096; font-size: 14px; font-weight: 600; } .value { font-size: 28px; font-weight: 800; color: ${props => props.$color || '#2d3748'}; }`;

const ClientsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px;`;
const ClientCard = styled.div`background: white; border-radius: 12px; border: 1px solid #edf2f7; padding: 24px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: 0.2s; border-top: 4px solid ${props => props.$statusColor || '#3182ce'}; &:hover { box-shadow: 0 8px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }`;
const ClientHeader = styled.div`display: flex; justify-content: space-between; align-items: flex-start; h3 { margin: 0; font-size: 18px; color: #2d3748; font-weight: 800; line-height: 1.3; } .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; background: ${props => props.$badgeBg}; color: ${props => props.$badgeColor}; }`;
const ClientInfo = styled.div`display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #4a5568; div { display: flex; align-items: center; gap: 8px; } strong { color: #2d3748; }`;
const ClientFooter = styled.div`display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #edf2f7; margin-top: auto; .fee { font-size: 18px; font-weight: 800; color: #38a169; } .actions { display: flex; gap: 8px; button { background: #f7fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; color: #718096; cursor: pointer; transition: 0.2s; &:hover { background: #edf2f7; color: #2d3748; } &.delete:hover { background: #fff5f5; color: #e53e3e; border-color: #feb2b2; } } }`;

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(2px);`;
const ModalContent = styled.div`background: white; padding: 32px; border-radius: 16px; width: 100%; max-width: 600px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto;`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; label { font-size: 13px; font-weight: 700; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; } input, select { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; &:focus { border-color: #3182ce; } }`;
const ModalActions = styled.div`display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; button { padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; border: none; } .cancel { background: #edf2f7; color: #4a5568; &:hover { background: #e2e8f0; } } .save { background: #3182ce; color: white; &:hover { background: #2c5282; } }`;

const fetcher = (url) => api.get(url).then((res) => res.data);

export default function Clients() {
  const { user } = useAuth();
  const { data: clients, mutate } = useSWR('/clients', fetcher);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ fullName: '', document: '', taxRegime: '', monthlyFee: '', email: '', phone: '', status: 'ATIVO' });

  const isClientAccess = user?.role === 'CLIENT';

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || (c.document && c.document.includes(searchTerm)));
  }, [clients, searchTerm]);

  // Inteligência do Dashboard
  const summary = useMemo(() => {
    if (!clients) return { total: 0, mrr: 0, inadimplentes: 0 };
    return clients.reduce((acc, c) => {
      acc.total += 1;
      if (c.status === 'ATIVO') acc.mrr += (c.monthlyFee || 0);
      if (c.status === 'INADIMPLENTE') acc.inadimplentes += 1;
      return acc;
    }, { total: 0, mrr: 0, inadimplentes: 0 });
  }, [clients]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  function handleOpenNew() {
    setEditingId(null);
    setForm({ fullName: '', document: '', taxRegime: '', monthlyFee: '', email: '', phone: '', status: 'ATIVO' });
    setIsModalOpen(true);
  }

  function handleEdit(c) {
    setEditingId(c.id);
    setForm({ fullName: c.fullName, document: c.document || '', taxRegime: c.taxRegime || '', monthlyFee: c.monthlyFee || '', email: c.email || '', phone: c.phone || '', status: c.status || 'ATIVO' });
    setIsModalOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Certeza que deseja excluir este cliente do CRM?')) return;
    const tId = toast.loading('A excluir...');
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Cliente removido!', { id: tId });
      mutate();
    } catch (err) { toast.error('Erro ao remover.', { id: tId }); }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.fullName) return toast.error('O nome da empresa é obrigatório.');
    const tId = toast.loading('A guardar cliente...');
    try {
      if (editingId) await api.put(`/clients/${editingId}`, form);
      else await api.post('/clients', form);
      
      toast.success('Cliente guardado com sucesso!', { id: tId });
      setIsModalOpen(false);
      mutate();
    } catch (err) { toast.error('Erro ao guardar.', { id: tId }); }
  }

  if (isClientAccess) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Acesso Restrito ao Escritório.</div>;
  }

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>CRM Contábil</h1>
          <SearchContainer>
            <Search size={18} color="#a0aec0" style={{ marginRight: 8 }} />
            <input placeholder="Procurar empresa ou CNPJ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </SearchContainer>
        </div>
        <ActionButton onClick={handleOpenNew}><Plus size={18} /> Novo Cliente</ActionButton>
      </Header>

      <CardsGrid>
        <StatCard>
          <div className="title">Empresas Atendidas <Building size={18} color="#3182ce" /></div>
          <div className="value" style={{ color: '#3182ce' }}>{summary.total}</div>
        </StatCard>
        <StatCard>
          <div className="title">Receita Mensal (Honorários) <DollarSign size={18} color="#38a169" /></div>
          <div className="value" style={{ color: '#38a169' }}>{formatCurrency(summary.mrr)}</div>
        </StatCard>
        <StatCard>
          <div className="title">Inadimplentes <AlertCircle size={18} color="#e53e3e" /></div>
          <div className="value" style={{ color: '#e53e3e' }}>{summary.inadimplentes} empresas</div>
        </StatCard>
      </CardsGrid>

      {!clients ? (
        <p style={{ color: '#a0aec0', textAlign: 'center', marginTop: 40 }}>A carregar base de clientes...</p>
      ) : filteredClients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '1px dashed #cbd5e0' }}>
          <Users size={48} color="#cbd5e0" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#4a5568', margin: '0 0 8px 0' }}>Nenhum cliente cadastrado</h3>
          <p style={{ color: '#a0aec0', margin: 0 }}>Clique no botão azul acima para cadastrar a sua primeira empresa.</p>
        </div>
      ) : (
        <ClientsGrid>
          {filteredClients.map(c => {
            const isAtivo = c.status === 'ATIVO';
            const isAlert = c.status === 'INADIMPLENTE';
            
            let statusColor = '#3182ce'; let badgeBg = '#ebf8ff'; let badgeColor = '#2b6cb0';
            if (isAlert) { statusColor = '#e53e3e'; badgeBg = '#fff5f5'; badgeColor = '#c53030'; }
            if (c.status === 'INATIVO') { statusColor = '#a0aec0'; badgeBg = '#edf2f7'; badgeColor = '#4a5568'; }

            return (
              <ClientCard key={c.id} $statusColor={statusColor}>
                <ClientHeader $badgeBg={badgeBg} $badgeColor={badgeColor}>
                  <h3>{c.fullName}</h3>
                  <span className="badge">{c.status}</span>
                </ClientHeader>
                
                <ClientInfo>
                  <div><FileText size={16} /> <strong>CNPJ:</strong> {c.document || 'Não informado'}</div>
                  <div><ShieldCheck size={16} /> <strong>Regime:</strong> {c.taxRegime || 'Não informado'}</div>
                  {c.email && <div><Phone size={16} /> <strong>Contato:</strong> {c.email}</div>}
                </ClientInfo>

                <ClientFooter>
                  <div className="fee">{formatCurrency(c.monthlyFee)} <span style={{ fontSize: 11, color: '#a0aec0', fontWeight: 600 }}>/MÊS</span></div>
                  <div className="actions">
                    <button onClick={() => handleEdit(c)}><Edit size={16} /></button>
                    <button className="delete" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
                  </div>
                </ClientFooter>
              </ClientCard>
            );
          })}
        </ClientsGrid>
      )}

      {/* MODAL DE CADASTRO DO CRM */}
      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2 style={{ marginBottom: 24 }}>{editingId ? 'Editar Cliente' : 'Cadastrar Empresa'}</h2>
            <form onSubmit={handleSave}>
              <FormGroup>
                <label>Razão Social / Nome Fantasia *</label>
                <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required placeholder="Ex: Padaria do João Ltda" />
              </FormGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>CNPJ / Documento</label>
                  <input value={form.document} onChange={e => setForm({...form, document: e.target.value})} placeholder="00.000.000/0001-00" />
                </FormGroup>
                <FormGroup>
                  <label>Regime Tributário</label>
                  <select value={form.taxRegime} onChange={e => setForm({...form, taxRegime: e.target.value})}>
                    <option value="">Selecione...</option>
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                    <option value="MEI">MEI / Pessoa Física</option>
                  </select>
                </FormGroup>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>Honorários Mensais (R$)</label>
                  <input type="number" step="0.01" value={form.monthlyFee} onChange={e => setForm({...form, monthlyFee: e.target.value})} placeholder="Valor do contrato" />
                </FormGroup>
                <FormGroup>
                  <label>Status Contratual</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="ATIVO">✅ Ativo (Em dia)</option>
                    <option value="INADIMPLENTE">⚠️ Inadimplente</option>
                    <option value="INATIVO">❌ Inativo / Rescindido</option>
                  </select>
                </FormGroup>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>E-mail de Contato</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contato@empresa.com" />
                </FormGroup>
                <FormGroup>
                  <label>Telefone / WhatsApp</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(11) 90000-0000" />
                </FormGroup>
              </div>

              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Salvar no CRM</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

    </Container>
  );
}