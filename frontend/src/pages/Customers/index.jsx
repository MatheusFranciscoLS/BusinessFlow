import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Users, Search, Plus, Edit, Trash2, ShieldAlert,
  Building2, DollarSign, Mail, Phone, CalendarClock, Briefcase
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container, Header, Toolbar, SearchBar, ActionButton,
  Grid, Card, Badge, ModalOverlay, ModalContent, FormGroup, ModalActions
} from './styles';

// 🔥 IMPORTAMOS AS MÁSCARAS DE UX!
import { maskCPFOrCNPJ, maskPhone, maskCurrency, unmaskCurrency } from '../../utils/masks';

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Clients() {
  const { user, selectedCompany } = useAuth();
  const isClient = user?.role === 'CLIENT';

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // O monthlyFee agora é String para suportar a máscara "1.500,00"
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

  function handleOpenNew() {
    setEditingId(null);
    setForm({ fullName: '', document: '', taxRegime: 'Simples Nacional', monthlyFee: '', status: 'ATIVO', email: '', phone: '', certificateExpiry: '' });
    setIsModalOpen(true);
  }

  function handleEdit(client) {
    setEditingId(client.id);
    
    // Tratamento impecável para a máscara de moeda receber o valor do banco de dados
    const feeString = client.monthlyFee ? (client.monthlyFee).toFixed(2).replace('.', '') : '0';
    
    // Extrai o YYYY-MM-DD da data de forma segura, ignorando Timezones
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
    const tId = toast.loading('A guardar dossiê...');
    
    // 🔥 Tratamento final para enviar ao Banco de Dados
    // Se existir data, converte-a forçando o início do dia para evitar que retroceda 1 dia por causa do fuso horário
    let parsedDate = null;
    if (form.certificateExpiry) {
      parsedDate = new Date(`${form.certificateExpiry}T00:00:00`).toISOString();
    }

    const payload = { 
      ...form, 
      companyId: selectedCompany.id,
      monthlyFee: unmaskCurrency(form.monthlyFee), // Volta de "1.500,00" para 1500.00
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
    } catch (err) { toast.error('Erro ao salvar.', { id: tId }); }
  }

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
        <h1><Users color="#3182ce" size={32} /> Gestão de Clientes (CRM)</h1>
        <ActionButton onClick={handleOpenNew}><Plus size={18} /> Novo Cliente</ActionButton>
      </Header>

      <Toolbar>
        <SearchBar>
          <Search size={18} color="#a0aec0" style={{ marginRight: 8 }} />
          <input 
            placeholder="Procurar por Razão Social ou CNPJ..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
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
              <div className="card-header">
                <div>
                  <div className="client-name">{client.fullName}</div>
                  <div className="client-doc"><Building2 size={14} /> {maskCPFOrCNPJ(client.document) || 'Sem CNPJ'}</div>
                </div>
                <Badge $status={client.status}>{client.status}</Badge>
              </div>

              <div className="card-body">
                <div className="info-row"><Briefcase size={16} color="#718096" /> {client.taxRegime || 'Não Informado'}</div>
                <div className="info-row"><DollarSign size={16} color="#38a169" /> Honorários: <strong>{formatCurrency(client.monthlyFee)}</strong></div>
                <div className="info-row"><Mail size={16} color="#718096" /> {client.email || '-'}</div>
                <div className="info-row"><Phone size={16} color="#718096" /> {maskPhone(client.phone) || '-'}</div>
                
                {client.certificateExpiry && (
                  <div className="info-row" style={{ color: '#d69e2e', fontWeight: 600, background: '#fffff0', padding: '6px 8px', borderRadius: 6 }}>
                    <CalendarClock size={16} /> e-CNPJ Vence: {new Date(client.certificateExpiry).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button onClick={() => handleEdit(client)} style={{ background: '#ebf8ff', color: '#3182ce', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', gap: 6 }}><Edit size={16}/> Editar</button>
                <button onClick={() => handleDelete(client.id)} style={{ background: '#fff5f5', color: '#e53e3e', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', gap: 6 }}><Trash2 size={16}/> Excluir</button>
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
              {editingId ? 'Editar Dossiê' : 'Cadastrar Novo Cliente'}
            </h2>
            
            <form onSubmit={handleSave}>
              <FormGroup>
                <label>Razão Social / Nome Completo *</label>
                <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Ex: Clínica Sorriso LTDA" />
              </FormGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>CNPJ / CPF</label>
                  {/* 🔥 Máscara a atuar em tempo real! */}
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
                  {/* 🔥 Mudei de type="number" para "text" para suportar a máscara e não bloquear vírgulas */}
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
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contato@empresa.com" />
                </FormGroup>
                <FormGroup>
                  <label>Telefone / WhatsApp</label>
                  {/* 🔥 Máscara de Telefone em tempo real! */}
                  <input value={form.phone} onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} placeholder="(11) 90000-0000" maxLength={15} />
                </FormGroup>
              </div>

              <FormGroup style={{ marginTop: 8, background: '#f7fafc', padding: 16, borderRadius: 8, border: '1px dashed #cbd5e0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dd6b20' }}>
                  <CalendarClock size={16} /> Vencimento do Certificado (e-CNPJ)
                </label>
                <input 
                  type="date" 
                  value={form.certificateExpiry} 
                  onChange={e => setForm({...form, certificateExpiry: e.target.value})} 
                  style={{ width: '100%', maxWidth: 200 }}
                />
                <span style={{ fontSize: 11, color: '#718096', marginTop: 4 }}>
                  Preencha para o sistema criar alertas automáticos no Kanban 30 dias antes de vencer.
                </span>
              </FormGroup>

              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Salvar Dossiê</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}