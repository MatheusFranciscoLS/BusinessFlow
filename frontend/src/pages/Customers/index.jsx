import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Users, Search, Plus, Edit, Trash2, ShieldAlert,
  Building2, DollarSign, Mail, Phone, CalendarClock, Briefcase,
  TrendingUp, AlertTriangle, MessageCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container, Header, Toolbar, SearchBar, ActionButton,
  Grid, Card, Badge, ModalOverlay, ModalContent, FormGroup, ModalActions,
  SummaryGrid, SummaryCard, Avatar
} from './styles';

import { maskCPFOrCNPJ, maskPhone, maskCurrency, unmaskCurrency } from '../../utils/masks';

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Clients() {
  const { user, selectedCompany } = useAuth();
  const isClient = user?.role === 'CLIENT';

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // 🔥 PROTEÇÃO ANTI-DUPLO CLIQUE
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    fullName: '', document: '', taxRegime: '', monthlyFee: '', 
    status: 'ATIVO', email: '', phone: '', certificateExpiry: ''
  });

  const { data: clients, mutate } = useSWR(
    !isClient && selectedCompany ? `/clients?companyId=${selectedCompany.id}` : null, 
    fetcher
  );

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => 
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.document && c.document.includes(searchTerm))
    );
  }, [clients, searchTerm]);

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const crmMetrics = useMemo(() => {
    if (!clients) return { total: 0, mrr: 0, inadimplentes: 0 };
    return clients.reduce((acc, c) => {
      acc.total += 1;
      if (c.status === 'ATIVO') acc.mrr += (c.monthlyFee || 0);
      if (c.status === 'INADIMPLENTE') acc.inadimplentes += 1;
      return acc;
    }, { total: 0, mrr: 0, inadimplentes: 0 });
  }, [clients]);

  // 🔥 GERA A DATA DE HOJE PARA BLOQUEAR O PASSADO NO INPUT
  const todayStr = new Date().toISOString().split('T')[0];

  function handleOpenNew() {
    setEditingId(null);
    setForm({ fullName: '', document: '', taxRegime: 'Simples Nacional', monthlyFee: '', status: 'ATIVO', email: '', phone: '', certificateExpiry: '' });
    setIsModalOpen(true);
  }

  function handleEdit(client) {
    setEditingId(client.id);
    
    const feeString = client.monthlyFee ? (client.monthlyFee).toFixed(2).replace('.', '') : '0';
    const safeDate = client.certificateExpiry ? client.certificateExpiry.substring(0, 10) : '';

    setForm({
      fullName: client.fullName,
      document: maskCPFOrCNPJ(client.document || ''),
      taxRegime: client.taxRegime || 'Simples Nacional',
      monthlyFee: maskCurrency(feeString), 
      status: client.status,
      email: client.email || '',
      phone: maskPhone(client.phone || ''),
      certificateExpiry: safeDate
    });
    setIsModalOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Tem certeza? Isso apagará o histórico deste cliente.')) return;
    const tId = toast.loading('A excluir...');
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Cliente excluído.', { id: tId });
      mutate();
    } catch (err) { toast.error('Erro ao excluir.', { id: tId }); }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (isSubmitting) return; // Bloqueia se já estiver a enviar
    
    setIsSubmitting(true);
    const tId = toast.loading('A guardar dossiê...');
    
    // Converte a data assegurando o meio-dia (UTC) para evitar bugs de fuso horário
    let parsedDate = null;
    if (form.certificateExpiry) {
      parsedDate = new Date(`${form.certificateExpiry}T12:00:00Z`).toISOString();
    }

    const payload = { 
      ...form, 
      companyId: selectedCompany.id,
      monthlyFee: unmaskCurrency(form.monthlyFee), 
      certificateExpiry: parsedDate
    };

    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, payload);
        toast.success('Cliente atualizado!', { id: tId });
      } else {
        await api.post('/clients', payload);
        toast.success('Cliente registado!', { id: tId });
      }
      setIsModalOpen(false);
      mutate();
    } catch (err) { 
      toast.error('Erro ao salvar.', { id: tId }); 
    } finally {
      setIsSubmitting(false); // Liberta o botão independentemente de sucesso ou erro
    }
  }

  // TELA DE BLOQUEIO PARA CLIENTES
  if (isClient) {
    return (
      <Container style={{ textAlign: 'center', padding: 60 }}>
        <ShieldAlert size={48} color="#e53e3e" style={{ marginBottom: 16 }} />
        <h2>Acesso Negado</h2>
        <p>A gestão de carteira de clientes é restrita ao escritório contábil.</p>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1><Users color="#3182ce" size={32} /> Carteira de Clientes</h1>
        <ActionButton onClick={handleOpenNew}><Plus size={18} /> Novo Cliente</ActionButton>
      </Header>

{/* 🔥 DASHBOARD EXECUTIVO DO CRM */}
      <SummaryGrid>
        <SummaryCard>
          <div className="icon"><Users size={28} /></div>
          <div className="info">
            <div className="label">Total de Contratos</div>
            <div className="value">{crmMetrics.total}</div>
          </div>
        </SummaryCard>
        
        <SummaryCard>
          <div className="icon" style={{ background: '#f0fff4', color: '#38a169' }}><TrendingUp size={28} /></div>
          <div className="info">
            <div className="label">Receita Ativa (MRR)</div>
            <div className="value" style={{ color: '#22543d' }}>{formatCurrency(crmMetrics.mrr)}</div>
          </div>
        </SummaryCard>

        <SummaryCard $danger={crmMetrics.inadimplentes > 0}>
          <div className="icon"><AlertTriangle size={28} /></div>
          <div className="info">
            <div className="label">Inadimplentes</div>
            <div className="value">{crmMetrics.inadimplentes}</div>
          </div>
        </SummaryCard>
      </SummaryGrid>

      <Toolbar>
        <SearchBar style={{ maxWidth: 400 }}>
          <Search size={18} color="#a0aec0" style={{ marginRight: 8 }} />
          <input placeholder="Procurar por Razão Social ou CNPJ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </SearchBar>
      </Toolbar>

      {!clients ? (
        <p style={{ color: '#a0aec0', textAlign: 'center' }}>A carregar carteira de clientes...</p>
      ) : filteredClients.length === 0 ? (
        <p style={{ color: '#a0aec0', textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>Nenhum cliente encontrado.</p>
      ) : (
        <Grid>
          {filteredClients.map(client => (
            <Card key={client.id}>
<div className="card-header" style={{ gap: 16 }}>
                {/* 🔥 AVATAR COM A INICIAL DA EMPRESA */}
                <Avatar>{client.fullName.charAt(0).toUpperCase()}</Avatar>
<div style={{ flex: 1, minWidth: 0 }}>
                  <div className="client-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={client.fullName}>
                    {client.fullName}
                  </div>
                  <div className="client-doc" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Building2 size={14} style={{ flexShrink: 0, color: '#a0aec0' }} />
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#4a5568' }}>
                      {maskCPFOrCNPJ(client.document) || 'Sem CNPJ'}
                    </span>
                  </div>
                </div>
                <Badge $status={client.status}>{client.status}</Badge>
              </div>

              <div className="card-body">
                <div className="info-row"><Briefcase size={16} color="#718096" /> {client.taxRegime || 'Não Informado'}</div>
                <div className="info-row"><DollarSign size={16} color="#38a169" /> Honorários: <strong style={{ color: '#38a169' }}>{formatCurrency(client.monthlyFee)}</strong></div>
                <div className="info-row"><Mail size={16} color="#718096" /> {client.email || '-'}</div>
                
                {/* 🔥 O NOVO BOTÃO DE COMUNICAÇÃO 1-CLICK */}
                <div className="info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={16} color="#718096" /> {maskPhone(client.phone) || '-'}
                  </div>
                  {client.phone && (
                    <button 
                      onClick={() => window.open(`https://api.whatsapp.com/send?phone=55${client.phone.replace(/\\D/g, '')}&text=${encodeURIComponent(`Olá, sou do escritório ${selectedCompany?.name || 'de contabilidade'}. Tudo bem?`)}`, '_blank')}
                      style={{ background: '#f0fff4', color: '#25D366', border: '1px solid #9ae6b4', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, transition: '0.2s' }}
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                  )}
                </div>
                
                {client.certificateExpiry && (
                  <div className="info-row" style={{ color: '#d69e2e', fontWeight: 700, background: '#fffff0', padding: '8px 12px', borderRadius: 8, marginTop: 4 }}>
                    <CalendarClock size={16} /> e-CNPJ Vence: {new Date(client.certificateExpiry).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button onClick={() => handleEdit(client)} style={{ background: '#ebf8ff', color: '#3182ce', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, transition: '0.2s' }}><Edit size={16}/> Editar Cadastro</button>
                <button onClick={() => handleDelete(client.id)} style={{ background: '#fff5f5', color: '#e53e3e', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, transition: '0.2s' }}><Trash2 size={16}/> Excluir</button>
              </div>
            </Card>
          ))}
        </Grid>
      )}

      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2 style={{ marginBottom: 24, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 }}>
              {editingId ? <Edit color="#3182ce" /> : <Plus color="#3182ce" />} 
              {editingId ? 'Editar Cadastro' : 'Cadastrar Novo Cliente'}
            </h2>
            
            <form onSubmit={handleSave}>
              <FormGroup>
                <label>Razão Social / Nome Completo *</label>
                <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Ex: Clínica Sorriso LTDA" />
              </FormGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>CNPJ / CPF</label>
                  <input value={form.document} onChange={e => setForm({...form, document: maskCPFOrCNPJ(e.target.value)})} placeholder="00.000.000/0001-00" maxLength={18} />
                </FormGroup>
                <FormGroup>
                  <label>Regime Tributário</label>
                  <select value={form.taxRegime} onChange={e => setForm({...form, taxRegime: e.target.value})}>
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                    <option value="MEI">MEI / Pessoa Física</option>
                  </select>
                </FormGroup>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>Honorário Mensal (R$)</label>
                  <input type="text" value={form.monthlyFee} onChange={e => setForm({...form, monthlyFee: maskCurrency(e.target.value)})} placeholder="Ex: 1.500,00" />
                </FormGroup>
                <FormGroup>
                  <label>Status do Cliente</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="ATIVO">✅ Ativo (Em Dia)</option>
                    <option value="INADIMPLENTE">⚠️ Inadimplente</option>
                    <option value="SUSPENSO">🛑 Suspenso / Cancelado</option>
                  </select>
                </FormGroup>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>E-mail Principal</label>
                  {/* 🔥 HIGIENIZAÇÃO DE E-MAIL EM TEMPO REAL */}
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value.trim().toLowerCase()})} placeholder="contato@empresa.com" />
                </FormGroup>
                <FormGroup>
                  <label>Telefone / WhatsApp</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} placeholder="(11) 90000-0000" maxLength={15} />
                </FormGroup>
              </div>

              <FormGroup style={{ marginTop: 8, background: '#f7fafc', padding: 16, borderRadius: 8, border: '1px dashed #cbd5e0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dd6b20' }}>
                  <CalendarClock size={16} /> Vencimento do Certificado (e-CNPJ)
                </label>
                <input 
                  type="date" 
                  min={todayStr} /* 🔥 AQUI ESTÁ A PROTEÇÃO CONTRA O PASSADO */
                  value={form.certificateExpiry} 
                  onChange={e => setForm({...form, certificateExpiry: e.target.value})} 
                  style={{ width: '100%', maxWidth: 200 }}
                />
                <span style={{ fontSize: 11, color: '#718096', marginTop: 4 }}>
                  Preencha para o sistema criar alertas automáticos no Kanban 30 dias antes de vencer.
                </span>
              </FormGroup>

              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className="save" disabled={isSubmitting}>
                  {isSubmitting ? 'A salvar...' : 'Salvar Dossiê'}
                </button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}