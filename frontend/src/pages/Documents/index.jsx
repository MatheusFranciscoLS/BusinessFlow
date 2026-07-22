import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  FolderLock, UploadCloud, FileText, Download, Trash2,
  Search, Filter, Folder, Building2, CheckCircle,
  Image as ImageIcon, Clock
} from 'lucide-react';

import {
  Container, Header, ActionButton, SearchBar, SelectFilter, FilterContainer,
  DocsGrid, DocCard, ModalOverlay, ModalContent, FormGroup, ModalActions
} from './styles';

const fetcher = (url) => api.get(url).then(res => res.data);
const CATEGORIES = ["Societário (Contrato Social)", "Fiscal e Tributário", "Alvarás e Licenças", "Trabalhista / RH", "Outros"];

export default function Documents() {
  const { user, selectedCompany } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const queryCompany = isClient ? user.companyAccessId : selectedCompany?.id;

  const queryParams = queryCompany
    ? `?companyId=${queryCompany}&role=${user?.role}&userEmail=${user?.email}`
    : null;

  const { data: clients } = useSWR(!isClient && queryCompany ? `/clients?companyId=${queryCompany}` : null, fetcher);
  const { data: documents, mutate } = useSWR(queryParams ? `/documents${queryParams}` : null, fetcher);

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
    if (form.file && form.file.size > 5242880) {
      return toast.error("O ficheiro é muito pesado! O limite máximo é de 5MB.");
    }

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

  async function handleConfirmRead(id) {
    const tId = toast.loading("A confirmar leitura...");
    try {
      await api.put(`/documents/${id}/read`);
      toast.success("Leitura confirmada com sucesso!", { id: tId });
      mutate();
    } catch (err) {
      toast.error("Erro ao confirmar leitura.", { id: tId });
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

  async function handleSignDocument(id) {
    if (!window.confirm("Ao assinar, será gerado um certificado legal com o seu IP. Deseja continuar?")) return;

    const tId = toast.loading("A gerar hash de segurança...");
    try {
      await api.put(`/documents/${id}/sign`);
      toast.success("Documento assinado com validade legal!", { id: tId });
      mutate(); // Atualiza a tela automaticamente
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao assinar documento.", { id: tId });
    }
  }

  const getFileUrl = (path) => `${api.defaults.baseURL.replace('/api', '')}${path}`; // Código existente

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

      {/* 🔥 FILTROS QUE ESTICAM NO MOBILE */}
      <FilterContainer>
        <SearchBar>
          <Search size={18} color="#a0aec0" style={{ marginRight: 8 }} />
          <input placeholder="Procurar por nome do documento ou cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </SearchBar>
        <div className="select-wrapper">
          <Filter size={18} color="#718096" style={{ marginRight: 8 }} />
          <SelectFilter value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">Todas as Pastas</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectFilter>
        </div>
      </FilterContainer>

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
          {filteredDocs.map(doc => {
            const isPdf = doc.fileUrl?.toLowerCase().includes('.pdf') || doc.name.toLowerCase().includes('.pdf');
            const isImage = doc.fileUrl?.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null || doc.name.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null;

            const iconBg = isPdf ? '#fff5f5' : isImage ? '#faf5ff' : '#ebf8ff';
            const iconColor = isPdf ? '#e53e3e' : isImage ? '#805ad5' : '#3182ce';
            const IconComponent = isImage ? ImageIcon : FileText;

            return (
              <DocCard key={doc.id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: iconBg, padding: 12, borderRadius: 8, color: iconColor }}>
                    <IconComponent size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#2d3748', fontSize: 16 }}>{doc.name}</h4>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#edf2f7', padding: '2px 8px', borderRadius: 12, color: '#4a5568' }}>{doc.category}</span>
                  </div>
                </div>

                {/* 🔥 RODAPÉ À PROVA DE MOBILE */}
                <div className="card-footer">
                  <div className="footer-info">
                    {!isClient && doc.client && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} /> {doc.client.fullName}</span>}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>

                      {!isClient && (
                        doc.readAt ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fff4', color: '#2f855a', padding: '2px 8px', borderRadius: 12, fontWeight: 700, fontSize: 10 }} title={`Lido em ${new Date(doc.readAt).toLocaleString('pt-BR')}`}>
                            <CheckCircle size={10} /> Lido
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fffff0', color: '#d69e2e', padding: '2px 8px', borderRadius: 12, fontWeight: 700, fontSize: 10, border: '1px solid #fbd38d' }} title="O cliente ainda não confirmou leitura">
                            <Clock size={10} /> Não lido
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="footer-actions">
                    {doc.isSigned ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0fff4', color: '#2f855a', padding: '6px 12px', borderRadius: 16, fontWeight: 700, fontSize: 12, border: '1px solid #9ae6b4' }} title="Assinado Eletronicamente">
                        <CheckCircle size={14} /> Assinado
                      </span>
                    ) : isClient ? (
                      <button onClick={() => handleSignDocument(doc.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3182ce', color: 'white', padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', transition: '0.2s' }}>
                        ✍️ Assinar
                      </button>
                    ) : null}
                    {isClient && !doc.readAt && (
                      <button onClick={() => handleConfirmRead(doc.id)} style={{ background: '#f0fff4', border: '1px solid #9ae6b4', padding: 8, borderRadius: 6, color: '#2f855a', cursor: 'pointer', transition: '0.2s' }} title="Confirmar leitura">
                        <CheckCircle size={18} />
                      </button>
                    )}

                    <a href={getFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" style={{ background: '#f7fafc', border: '1px solid #e2e8f0', padding: 8, borderRadius: 6, color: '#3182ce', display: 'flex', transition: '0.2s' }} title="Baixar/Visualizar">
                      <Download size={18} />
                    </a>

                    {!isClient && (
                      <button onClick={() => handleDelete(doc.id)} style={{ background: '#fff5f5', border: '1px solid #fed7d7', padding: 8, borderRadius: 6, color: '#e53e3e', cursor: 'pointer', transition: '0.2s' }} title="Eliminar Documento">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </DocCard>
            );
          })}
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
                <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
                  <option value="">Selecione o dono do documento...</option>
                  {clients?.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </FormGroup>

              <FormGroup>
                <label>Nome do Ficheiro (Ex: Contrato Social 2026)</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </FormGroup>

              <FormGroup>
                <label>Pasta / Categoria</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormGroup>

              <FormGroup style={{ marginTop: 16 }}>
                <label>Anexar o PDF ou Imagem</label>
                <div style={{ border: '2px dashed #cbd5e0', padding: '24px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', position: 'relative', background: '#f7fafc' }}>
                  <input type="file" onChange={e => setForm({ ...form, file: e.target.files[0] })} accept="image/*,application/pdf" style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} required />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#4a5568' }}>
                    <UploadCloud size={28} style={{ marginBottom: 8, color: '#3182ce' }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{form.file ? form.file.name : "Clique ou arraste o ficheiro para aqui"}</span>
                  </div>
                </div>
              </FormGroup>

              {/* 🔥 BOTÕES DE AÇÃO EMPILHÁVEIS NO MOBILE */}
              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Salvar no Cofre</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}