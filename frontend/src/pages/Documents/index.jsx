import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FolderLock, UploadCloud, FileText, Download, Trash2, 
  Search, Filter, Folder, ShieldCheck, Building2
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const Container = styled.div`width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.4s ease;`;
const Header = styled.header`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; h1 { font-size: 26px; color: #1a202c; font-weight: 800; display: flex; align-items: center; gap: 12px; }`;
const ActionButton = styled.button`display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; background: #3182ce; color: white; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2); &:hover { background: #2c5282; transform: translateY(-2px); }`;

const SearchBar = styled.div`display: flex; alignItems: center; background: white; border: 1px solid #e2e8f0; borderRadius: 8px; padding: 0 16px; flex: 1; minWidth: 280px; height: 48px; input { border: none; outline: none; padding: 12px; width: 100%; fontSize: 14px; background: transparent; }`;
const SelectFilter = styled.select`height: 48px; padding: 0 16px; border-radius: 8px; border: 1px solid #e2e8f0; outline: none; background: white; color: #4a5568; font-weight: 600; cursor: pointer;`;

const DocsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;`;
const DocCard = styled.div`background: white; border-radius: 12px; border: 1px solid #edf2f7; padding: 20px; display: flex; flex-direction: column; gap: 16px; transition: 0.2s; &:hover { box-shadow: 0 8px 16px rgba(0,0,0,0.06); border-color: #cbd5e0; transform: translateY(-2px); }`;

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(2px);`;
const ModalContent = styled.div`background: white; padding: 32px; border-radius: 16px; width: 100%; max-width: 550px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; label { font-size: 13px; font-weight: 700; color: #4a5568; text-transform: uppercase; } input, select { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; }`;

const fetcher = (url) => api.get(url).then(res => res.data);

const CATEGORIES = ["Societário (Contrato Social)", "Fiscal e Tributário", "Alvarás e Licenças", "Trabalhista / RH", "Outros"];

export default function Documents() {
  const { user, selectedCompany } = useAuth();
  const isClient = user?.role === 'CLIENT';

  // O cliente tem o seu próprio ID, a agência usa o companyId para ver todos
  const queryCompany = isClient ? user.companyAccessId : selectedCompany?.id;
  
  // Buscar clientes para o select do upload (apenas para a Agência)
  const { data: clients } = useSWR(!isClient && selectedCompany ? '/clients' : null, fetcher);
  
  // Se for cliente, cruza o email dele com os clientes do CRM para saber o ID dele (como fizemos no Helpdesk)
  const myClientRecord = useMemo(() => {
    if (!isClient || !clients) return null;
    return clients.find(c => c.email === user.email);
  }, [isClient, clients, user]);

  const docQuery = useMemo(() => {
    if (!queryCompany) return null;
    if (isClient && myClientRecord) return `?companyId=${queryCompany}&clientId=${myClientRecord.id}`;
    if (!isClient) return `?companyId=${queryCompany}`;
    return null;
  }, [queryCompany, isClient, myClientRecord]);

  const { data: documents, mutate } = useSWR(docQuery ? `/documents${docQuery}` : null, fetcher);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Societário (Contrato Social)', clientId: '', file: null });

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (doc.client && doc.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === '' || doc.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchTerm, filterCategory]);

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

  // Monta a URL completa para o download
  const getFileUrl = (path) => `${api.defaults.baseURL.replace('/api', '')}${path}`;

  // Se for cliente mas o e-mail não estiver no CRM, bloqueia o ecrã (como no Helpdesk)
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

      {/* MODAL DE UPLOAD (Apenas Agência) */}
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