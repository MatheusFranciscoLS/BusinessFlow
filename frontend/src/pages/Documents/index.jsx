import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FolderLock, UploadCloud, FileText, Download, Trash2, 
  Search, Filter, Folder, ShieldCheck, Building2
} from 'lucide-react';
import {
  Container, Header, ActionButton, SearchBar, SelectFilter,
  DocsGrid, DocCard, ModalOverlay, ModalContent, FormGroup
} from './styles';

const fetcher = (url) => api.get(url).then(res => res.data);
const CATEGORIES = ["Societário (Contrato Social)", "Fiscal e Tributário", "Alvarás e Licenças", "Trabalhista / RH", "Outros"];

export default function Documents() {
  const { user, selectedCompany } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const queryCompany = isClient ? user.companyAccessId : selectedCompany?.id;
  
  // 🔥 SEGURANÇA TOTAL: Passa as credenciais de auditoria na URL para o MVC do Back-end
  const queryParams = queryCompany 
    ? `?companyId=${queryCompany}&role=${user?.role}&userEmail=${user?.email}` 
    : null;

  const { data: clients } = useSWR(!isClient && queryCompany ? `/clients?companyId=${queryCompany}` : null, fetcher);
  const { data: documents, mutate } = useSWR(queryParams ? `/documents${queryParams}` : null, fetcher);

  const myClientRecord = useMemo(() => {
    if (!isClient || !clients) return null;
    return clients.find(c => c.email === user.email);
  }, [isClient, clients, user]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Societário (Contrato Social)', clientId: '', file: null });

  // Default Deny Front-end
  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    
    // Se for cliente mas não for validado, não mostra nada visualmente
    if (isClient && !myClientRecord) return [];

    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (doc.client && doc.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === '' || doc.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchTerm, filterCategory, isClient, myClientRecord]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!form.file) return toast.error("Anexe um ficheiro.");
    if (!isClient && !form.clientId) return toast.error("Selecione o cliente dono deste documento.");

    const tId = toast.loading("A criptografar e enviar para o Cofre...");
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('file', form.file);
      formData.append('companyId', queryCompany);
      formData.append('clientId', form.clientId);

      await api.post('/documents', formData);
      toast.success("Documento guardado com sucesso!", { id: tId });
      setIsModalOpen(false);
      setForm({ name: '', category: 'Societário (Contrato Social)', clientId: '', file: null });
      mutate();
    } catch (err) {
      toast.error("Erro ao fazer upload.", { id: tId });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Atenção: Excluir este documento vai removê-lo do portal do cliente. Deseja continuar?")) return;
    const tId = toast.loading("A excluir...");
    try {
      await api.delete(`/documents/${id}`);
      toast.success("Documento excluído.", { id: tId });
      mutate();
    } catch (error) {
      toast.error("Erro ao excluir.", { id: tId });
    }
  }

  const getFileUrl = (path) => `${api.defaults.baseURL.replace('/api', '')}${path}`;

  // Se o cliente não existir no CRM, bloqueia a UI
  if (isClient && clients && !myClientRecord) {
    return (
      <Container style={{ textAlign: 'center', padding: 60 }}>
        <ShieldCheck size={48} color="#e53e3e" style={{ marginBottom: 16 }} />
        <h2>Acesso Pendente</h2>
        <p>O seu e-mail não foi encontrado no dossiê. Fale com o seu contador.</p>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1><FolderLock color="#3182ce" size={32} /> Cofre Digital (GED)</h1>
        {!isClient && (
          <ActionButton onClick={() => setIsModalOpen(true)}>
            <UploadCloud size={18} /> Novo Documento
          </ActionButton>
        )}
      </Header>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <SearchBar>
          <Search size={18} color="#a0aec0" style={{ marginRight: 8 }} />
          <input placeholder="Procurar por nome do documento ou cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </SearchBar>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <Filter size={18} color="#718096" style={{ marginRight: 8 }} />
          <SelectFilter value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ border: 'none', padding: 0 }}>
            <option value="">Todas as Pastas</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectFilter>
        </div>
      </div>

      {!documents ? (
        <p style={{ color: '#a0aec0', textAlign: 'center' }}>A abrir o cofre...</p>
      ) : filteredDocs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 12, border: '1px dashed #cbd5e0' }}>
          <Folder size={48} color="#cbd5e0" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#4a5568', margin: '0 0 8px 0' }}>Cofre Vazio</h3>
          <p style={{ color: '#a0aec0', margin: 0 }}>{isClient ? "O seu contador ainda não partilhou documentos consigo." : "Nenhum documento encontrado. Clique em Novo Documento para começar."}</p>
        </div>
      ) : (
        <DocsGrid>
          {filteredDocs.map(doc => (
            <DocCard key={doc.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ background: '#ebf8ff', padding: 12, borderRadius: 8, color: '#3182ce' }}><FileText size={24} /></div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#2d3748', fontSize: 16 }}>{doc.name}</h4>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#edf2f7', padding: '2px 8px', borderRadius: 12, color: '#4a5568' }}>{doc.category}</span>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #edf2f7', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#718096' }}>
                  {!isClient && doc.client && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Building2 size={12} /> {doc.client.fullName}</div>}
                  {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={getFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" style={{ background: '#f7fafc', border: '1px solid #e2e8f0', padding: 8, borderRadius: 6, color: '#3182ce', transition: '0.2s', display: 'flex' }} title="Baixar/Visualizar">
                    <Download size={18} />
                  </a>
                  {!isClient && (
                    <button onClick={() => handleDelete(doc.id)} style={{ background: '#fff5f5', border: '1px solid #fed7d7', padding: 8, borderRadius: 6, color: '#e53e3e', cursor: 'pointer' }} title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </DocCard>
          ))}
        </DocsGrid>
      )}

      {/* MODAL DE UPLOAD */}
      {isModalOpen && !isClient && (
        <ModalOverlay>
          <ModalContent>
            <h2 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}><UploadCloud color="#3182ce" /> Guardar Documento</h2>
            <form onSubmit={handleUpload}>
              
              <FormGroup>
                <label>Vincular a qual Cliente?</label>
                <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required>
                  <option value="">Selecione o dono do documento...</option>
                  {clients?.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </FormGroup>

              <FormGroup>
                <label>Nome do Ficheiro (Ex: Contrato Social 2026)</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </FormGroup>

              <FormGroup>
                <label>Pasta / Categoria</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormGroup>

              <FormGroup style={{ marginTop: 16 }}>
                <label>Anexar o PDF ou Imagem</label>
                <div style={{ border: '2px dashed #cbd5e0', padding: '24px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', position: 'relative', background: '#f7fafc' }}>
                  <input type="file" onChange={e => setForm({...form, file: e.target.files[0]})} accept="image/*,application/pdf" style={{ opacity: 0, position: 'absolute', top:0, left:0, width:'100%', height:'100%', cursor:'pointer' }} required />
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color: '#4a5568' }}>
                    <UploadCloud size={28} style={{ marginBottom: 8, color: '#3182ce' }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{form.file ? form.file.name : "Clique ou arraste o ficheiro para aqui"}</span>
                  </div>
                </div>
              </FormGroup>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#edf2f7', color: '#4a5568', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ background: '#3182ce', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Salvar no Cofre</button>
              </div>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}