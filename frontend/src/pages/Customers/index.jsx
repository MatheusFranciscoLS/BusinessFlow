import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <--- MUDANÇA 1: Importação explícita
import { Plus, Edit, Trash2, Search, FileText, Ghost } from 'lucide-react';
import { 
  Container, Header, Toolbar, SearchContainer, ButtonGroup, TableContainer, Table, 
  StatusBadge, ActionButton, ModalOverlay, ModalContent, FormGroup, ModalActions, EmptyState
} from './styles';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [cepLoading, setCepLoading] = useState(false);
  const numberInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpf: '',
    cep: '', street: '', number: '', neighborhood: '', city: '', state: '',
    tag: 'NOVO'
  });

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    try {
      const response = await api.get('/clients');
      setCustomers(response.data);
    } catch (error) {
      console.log("Erro ao carregar");
    }
  }

  // --- LÓGICA DE BUSCA ---
  const filteredCustomers = customers.filter(customer => 
    customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cpf.includes(searchTerm)
  );

  // --- LÓGICA DE PDF (CORRIGIDA) ---
  function handleExportPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Relatório de Clientes - BusinessFlow", 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ["Nome / Razão Social", "CPF/CNPJ", "E-mail", "Telefone", "Status"];
    const tableRows = [];

    filteredCustomers.forEach(customer => {
      const customerData = [
        customer.fullName,
        maskCPF_CNPJ(customer.cpf),
        customer.email,
        maskPhone(customer.phone || ''),
        customer.tag
      ];
      tableRows.push(customerData);
    });

    // <--- MUDANÇA 2: Uso da função importada
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [49, 130, 206] }
    });

    doc.save("clientes_businessflow.pdf");
    toast.success("Relatório baixado com sucesso!");
  }

  // --- MÁSCARAS ---
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
    setCepLoading(true);
    const tId = toast.loading('Buscando...');
    try {
      const { data } = await axios.get(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      setForm(prev => ({ ...prev, street: data.street, neighborhood: data.neighborhood, city: data.city, state: data.state }));
      toast.success('Encontrado!', { id: tId });
      setTimeout(() => numberInputRef.current?.focus(), 100);
    } catch { toast.error('CEP inválido', { id: tId }); } finally { setCepLoading(false); }
  }

  function handleOpenNew() {
    setEditingId(null);
    setForm({ name: '', email: '', phone: '', cpf: '', cep: '', street: '', number: '', neighborhood: '', city: '', state: '', tag: 'NOVO' });
    setIsModalOpen(true);
  }

  function handleEdit(customer) {
    setEditingId(customer.id);
    const parts = customer.address ? customer.address.split(',') : [];
    const street = parts[0] || '';
    setForm({
      ...customer,
      name: customer.fullName || customer.name,
      cpf: maskCPF_CNPJ(customer.cpf),
      phone: customer.phone ? maskPhone(customer.phone) : '',
      cep: customer.cep ? maskCEP(customer.cep) : '',
      street: street, 
      number: '', 
      neighborhood: '', city: '', state: '',
      tag: customer.tag || 'NOVO'
    });
    setIsModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm('Excluir cliente?')) {
      try {
        await api.delete(`/clients/${id}`);
        setCustomers(customers.filter(c => c.id !== id));
        toast.success('Removido!');
      } catch { toast.error('Erro ao excluir.'); }
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name) return toast.error('Nome obrigatório');
    const cleanCpf = form.cpf.replace(/\D/g, '');
    if (cleanCpf.length < 11) return toast.error('CPF inválido');

    const tId = toast.loading('Salvando...');
    try {
      const payload = {
        fullName: form.name, cpf: cleanCpf, email: form.email, phone: form.phone,
        cep: form.cep.replace(/\D/g, ''), address: `${form.street}, ${form.number}`, tag: form.tag,
      };

      if (editingId) {
        await api.put(`/clients/${editingId}`, payload);
        loadCustomers();
        toast.success('Atualizado!', { id: tId });
      } else {
        const response = await api.post('/clients', payload);
        setCustomers([...customers, response.data]); 
        toast.success('Cadastrado!', { id: tId });
      }
      setIsModalOpen(false);
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao salvar.';
      toast.error(msg, { id: tId });
    }
  }

  return (
    <Container>
      <Header>
        <h1>Meus Clientes</h1>
        <Toolbar>
          <SearchContainer>
            <Search size={20} color="#a0aec0" />
            <input 
              placeholder="Buscar por nome, email ou CPF..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>

          <ButtonGroup>
            <button className="secondary" onClick={handleExportPDF}>
              <FileText size={18} />
              Relatório PDF
            </button>
            <button className="primary" onClick={handleOpenNew}>
              <Plus size={20} />
              Novo Cliente
            </button>
          </ButtonGroup>
        </Toolbar>
      </Header>

      {customers.length === 0 ? (
        <EmptyState>
          <Ghost size={48} />
          <p>Nenhum cliente cadastrado ainda.</p>
          <small>Clique no botão "Novo Cliente" para começar.</small>
        </EmptyState>
      ) : filteredCustomers.length === 0 ? (
        <EmptyState>
          <Search size={48} />
          <p>Nenhum resultado para "{searchTerm}"</p>
          <small>Tente buscar por outro termo.</small>
        </EmptyState>
      ) : (
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
              {filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.fullName || customer.name}</strong><br/>
                    <small style={{ color: '#aaa' }}>{maskCPF_CNPJ(customer.cpf)}</small>
                  </td>
                  <td>{customer.email}<br/><small>{customer.phone}</small></td>
                  <td>{customer.address}</td>
                  <td><StatusBadge $tag={customer.tag}>{customer.tag}</StatusBadge></td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionButton onClick={() => handleEdit(customer)} color="#3182ce"><Edit size={18} /></ActionButton>
                    <ActionButton onClick={() => handleDelete(customer.id)} color="#e53e3e"><Trash2 size={18} /></ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}

      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>{editingId ? 'Editar' : 'Novo'} Cliente</h2>
            <form onSubmit={handleSave}>
              <FormGroup>
                <label>Nome Completo</label>
                <input name="name" value={form.name} onChange={handleChange} autoFocus />
              </FormGroup>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormGroup><label>CPF / CNPJ</label><input name="cpf" value={form.cpf} onChange={handleChange} maxLength={18} /></FormGroup>
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
                <FormGroup>
                  <label>CEP {cepLoading && '...'}</label>
                  <input name="cep" value={form.cep} onChange={handleChange} onBlur={handleBlurCep} maxLength={9} />
                </FormGroup>
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