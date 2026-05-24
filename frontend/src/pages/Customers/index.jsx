import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Edit, Trash2, Search, FileText, Ghost, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  Container, Header, Toolbar, SearchContainer, ButtonGroup, TableContainer, Table, 
  StatusBadge, ActionButton, ModalOverlay, ModalContent, FormGroup, ModalActions, EmptyState,
  PaginationContainer, ProfileHeader, ProfileStats, HistoryList
} from './styles';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  // Controles de Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [cepLoading, setCepLoading] = useState(false);
  const numberInputRef = useRef(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpf: '',
    cep: '', street: '', number: '', neighborhood: '', city: '', state: '', tag: 'NOVO'
  });

  useEffect(() => { loadCustomers(); }, []);

  // Reseta a página para 1 sempre que o utilizador faz uma busca
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  async function loadCustomers() {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setCustomers(response.data);
    } catch (error) {
      toast.error("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => 
      customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cpf.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  // Fatiar a lista para a Paginação
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  function handleExportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Relatório de Clientes", 14, 22);
    doc.setFontSize(10); doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);
    const tableColumn = ["Nome", "CPF/CNPJ", "E-mail", "Telefone", "Status"];
    const tableRows = filteredCustomers.map(c => [
      c.fullName, maskCPF_CNPJ(c.cpf), c.email || 'N/A', maskPhone(c.phone || ''), c.tag
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 35, styles: { fontSize: 8 }, headStyles: { fillColor: [49, 130, 206] } });
    doc.save("clientes.pdf"); toast.success("PDF baixado!");
  }

  const maskCPF_CNPJ = (v) => { v=v.replace(/\D/g,""); if(v.length<=11){return v.replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2")}else{return v.replace(/^(\d{2})(\d)/,"$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3").replace(/\.(\d{3})(\d)/,".$1/$2").replace(/(\d{4})(\d)/,"$1-$2").slice(0,18)} };
  const maskPhone = (v) => { v=v.replace(/\D/g,""); v=v.replace(/^(\d{2})(\d)/g,"($1) $2"); v=v.replace(/(\d)(\d{4})$/,"$1-$2"); return v.slice(0,15); };
  const maskCEP = (v) => { return v.replace(/\D/g,"").replace(/^(\d{5})(\d)/,"$1-$2").slice(0,9); };

  function handleChange(e) {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'cpf') finalValue = maskCPF_CNPJ(value);
    if (name === 'phone') finalValue = maskPhone(value);
    if (name === 'cep') finalValue = maskCEP(value);
    setForm({ ...form, [name]: finalValue });
  }

  async function handleBlurCep(e) {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true); const tId = toast.loading('A procurar...');
    try {
      const { data } = await axios.get(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      setForm(prev => ({ ...prev, street: data.street, neighborhood: data.neighborhood, city: data.city, state: data.state }));
      toast.success('Encontrado!', { id: tId }); setTimeout(() => numberInputRef.current?.focus(), 100);
    } catch { toast.error('CEP inválido', { id: tId }); } finally { setCepLoading(false); }
  }

  // A Mágica do Mini-CRM (Busca dados completos)
  async function openProfile(id) {
    const toastId = toast.loading('A carregar perfil...');
    try {
      const res = await api.get(`/clients/${id}`);
      setViewingClient(res.data);
      toast.dismiss(toastId);
    } catch {
      toast.error('Erro ao carregar o perfil.', { id: toastId });
    }
  }

  function handleOpenNew() {
    setEditingId(null);
    setForm({ name: '', email: '', phone: '', cpf: '', cep: '', street: '', number: '', neighborhood: '', city: '', state: '', tag: 'NOVO' });
    setIsModalOpen(true);
  }

  function handleEdit(customer) {
    setEditingId(customer.id);
    const parts = customer.address ? customer.address.split(',') : [];
    setForm({
      ...customer, name: customer.fullName || customer.name, cpf: maskCPF_CNPJ(customer.cpf), phone: customer.phone ? maskPhone(customer.phone) : '',
      cep: customer.cep ? maskCEP(customer.cep) : '', street: parts[0] || '', number: '', neighborhood: '', city: '', state: '', tag: customer.tag || 'NOVO'
    });
    setIsModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm('Excluir cliente permanentemente? O histórico também será apagado!')) {
      try { await api.delete(`/clients/${id}`); setCustomers(customers.filter(c => c.id !== id)); toast.success('Removido com sucesso!'); } 
      catch { toast.error('Erro ao excluir.'); }
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name) return toast.error('Nome obrigatório');
    const cleanCpf = form.cpf.replace(/\D/g, '');
    if (cleanCpf.length < 11) return toast.error('CPF/CNPJ inválido');

    const tId = toast.loading('A guardar...');
    try {
      const payload = { fullName: form.name, cpf: cleanCpf, email: form.email, phone: form.phone, cep: form.cep.replace(/\D/g, ''), address: `${form.street}, ${form.number}`, tag: form.tag };
      if (editingId) {
        await api.put(`/clients/${editingId}`, payload); loadCustomers(); toast.success('Atualizado!', { id: tId });
      } else {
        const response = await api.post('/clients', payload); setCustomers([response.data, ...customers]); toast.success('Cadastrado!', { id: tId });
      }
      setIsModalOpen(false);
    } catch (error) { toast.error(error.response?.data?.error || 'Erro ao salvar.', { id: tId }); }
  }

  return (
    <Container>
      <Header>
        <h1>Meus Clientes</h1>
        <Toolbar>
          <SearchContainer>
            <Search size={20} color="#a0aec0" />
            <input placeholder="Buscar por nome, email ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </SearchContainer>
          <ButtonGroup>
            <button className="secondary" onClick={handleExportPDF}><FileText size={18} /> Relatório PDF</button>
            <button className="primary" onClick={handleOpenNew}><Plus size={20} /> Novo Cliente</button>
          </ButtonGroup>
        </Toolbar>
      </Header>

      {loading ? ( <EmptyState><p>A carregar clientes...</p></EmptyState> ) 
      : customers.length === 0 ? ( <EmptyState><Ghost size={48} /><p>Nenhum cliente cadastrado.</p></EmptyState> ) 
      : filteredCustomers.length === 0 ? ( <EmptyState><Search size={48} /><p>Nenhum resultado para "{searchTerm}"</p></EmptyState> ) 
      : (
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Endereço</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map(customer => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.fullName || customer.name}</strong><br/>
                    <small style={{ color: '#a0aec0' }}>{maskCPF_CNPJ(customer.cpf)}</small>
                  </td>
                  <td>{customer.email || 'N/A'}<br/><small>{customer.phone ? maskPhone(customer.phone) : ''}</small></td>
                  <td>{customer.address || 'N/A'}</td>
                  <td><StatusBadge $tag={customer.tag}>{customer.tag}</StatusBadge></td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionButton onClick={() => openProfile(customer.id)} color="#38b2ac" title="Ver Perfil CRM"><Eye size={18} /></ActionButton>
                    <ActionButton onClick={() => handleEdit(customer)} color="#3182ce" title="Editar"><Edit size={18} /></ActionButton>
                    <ActionButton onClick={() => handleDelete(customer.id)} color="#e53e3e" title="Excluir"><Trash2 size={18} /></ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {/* PAGINAÇÃO INFERIOR */}
          <PaginationContainer>
            <span>Mostrando {paginatedCustomers.length} de {filteredCustomers.length} clientes</span>
            <div>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /> Anterior</button>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>Próxima <ChevronRight size={16} /></button>
            </div>
          </PaginationContainer>
        </TableContainer>
      )}

      {/* MODAL DE PERFIL DO CLIENTE (MINI-CRM) */}
      {viewingClient && (
        <ModalOverlay>
          <ModalContent>
            <ProfileHeader>
              <div className="avatar">{viewingClient.fullName?.charAt(0)}</div>
              <div className="info">
                <h2>{viewingClient.fullName}</h2>
                <p>{viewingClient.email || 'Sem e-mail'} | {maskPhone(viewingClient.phone || '')}</p>
                <p style={{marginTop: 4}}>{viewingClient.address}</p>
              </div>
              <StatusBadge $tag={viewingClient.tag}>{viewingClient.tag}</StatusBadge>
            </ProfileHeader>

            <ProfileStats>
              <div>
                <span>LTV (Total Gasto)</span>
                <strong className="green">
                  {formatCurrency(viewingClient.transactions?.filter(t => t.type === 'entrada' || t.type === 'income').reduce((a,b) => a + (b.amount || 0), 0))}
                </strong>
              </div>
              <div>
                <span>Total de Interações</span>
                <strong>{viewingClient.transactions?.length || 0}</strong>
              </div>
            </ProfileStats>

            <HistoryList>
              <h3>Últimas Movimentações</h3>
              {(!viewingClient.transactions || viewingClient.transactions.length === 0) ? (
                <p style={{ color: '#a0aec0', fontSize: 14 }}>Nenhum histórico financeiro registado.</p>
              ) : (
                <ul>
                  {viewingClient.transactions.slice(0, 5).map(t => {
                    const isIncome = t.type === 'entrada' || t.type === 'income';
                    return (
                      <li key={t.id}>
                        <div>
                          <div className="desc">{t.title || t.description || 'Serviço Prestado'}</div>
                          <div className="date">{new Date(t.date).toLocaleDateString('pt-BR')}</div>
                        </div>
                        <div className="val" style={{ color: isIncome ? '#12a454' : '#e53e3e' }}>
                          {isIncome ? '+ ' : '- '}{formatCurrency(t.amount)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </HistoryList>

            <ModalActions>
              <button type="button" className="cancel" onClick={() => setViewingClient(null)}>Fechar Perfil</button>
              <button type="button" className="save" onClick={() => { setViewingClient(null); handleEdit(viewingClient); }}>Editar Dados</button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* MODAL DE EDIÇÃO/CRIAÇÃO (MANTIDO O ORIGINAL) */}
      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>{editingId ? 'Editar' : 'Novo'} Cliente</h2>
            <form onSubmit={handleSave}>
              {/* O formulário de criação original continua a funcionar aqui */}
              <FormGroup><label>Nome Completo</label><input name="name" value={form.name} onChange={handleChange} autoFocus required/></FormGroup>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormGroup><label>CPF / CNPJ</label><input name="cpf" value={form.cpf} onChange={handleChange} maxLength={18} required/></FormGroup>
                <FormGroup><label>Categoria</label>
                  <select name="tag" value={form.tag} onChange={handleChange}>
                    <option value="NOVO">Novo</option>
                    <option value="RECORRENTE">Recorrente</option>
                    <option value="VIP">VIP</option>
                    <option value="INADIMPLENTE">Inadimplente</option>
                  </select>
                </FormGroup>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormGroup><label>E-mail</label><input name="email" value={form.email} onChange={handleChange} /></FormGroup>
                <FormGroup><label>Telefone</label><input name="phone" value={form.phone} onChange={handleChange} maxLength={15}/></FormGroup>
              </div>
              <h3 style={{ fontSize: '14px', color: '#718096', margin: '20px 0 10px', borderBottom: '1px solid #eee' }}>Endereço</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
                <FormGroup><label>CEP {cepLoading && '...'}</label><input name="cep" value={form.cep} onChange={handleChange} onBlur={handleBlurCep} maxLength={9} /></FormGroup>
                <FormGroup><label>Rua</label><input name="street" value={form.street} onChange={handleChange} readOnly style={{background:'#f7fafc'}}/></FormGroup>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 60px', gap: '16px' }}>
                <FormGroup><label>Nº</label><input ref={numberInputRef} name="number" value={form.number} onChange={handleChange} required /></FormGroup>
                <FormGroup><label>Bairro</label><input name="neighborhood" value={form.neighborhood} readOnly style={{background:'#f7fafc'}} /></FormGroup>
                <FormGroup><label>Cidade</label><input name="city" value={form.city} readOnly style={{background:'#f7fafc'}} /></FormGroup>
                <FormGroup><label>UF</label><input name="state" value={form.state} readOnly style={{background:'#f7fafc'}} /></FormGroup>
              </div>
              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Salvar</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}