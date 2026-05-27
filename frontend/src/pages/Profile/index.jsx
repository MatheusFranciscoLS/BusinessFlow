import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CircleUser, Upload, Trash2, Building2, Plus, Edit, Key, X } from 'lucide-react'; // 🔥 Importamos o X
import { useAuth } from '../../contexts/AuthContext';
import { 
  Container, Header, ProfileCard, AvatarSection, FormGrid, FormGroup, ActionButton,
  SectionTitle, CompanyList, CompanyItem, AddButton, ModalOverlay, ModalContent, ModalActions
} from './styles';

const fetcher = url => api.get(url).then(res => res.data);

export default function Profile() {
  const { user, updateUserData } = useAuth(); 
  
  // -- ESTADOS DO PERFIL --
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agencyName, setAgencyName] = useState(''); 
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);

  // -- ESTADOS DE EMPRESAS --
  const { data: userCompanies, mutate: mutateCompanies } = useSWR('/companies', fetcher);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyDocument, setCompanyDocument] = useState('');

  // 🔥 ESTADOS DO PAINEL DE ACESSOS (RBAC) --
  const [activeCompanyForAccess, setActiveCompanyForAccess] = useState(null);
  const [accessForm, setAccessForm] = useState({ name: '', email: '', password: '' });

  // SWR condicional: Só puxa a lista de clientes se o Modal de acessos estiver aberto!
  const { data: clientAccesses, mutate: mutateAccesses } = useSWR(
    activeCompanyForAccess ? `/auth/client-account/${activeCompanyForAccess.id}` : null, 
    fetcher
  );

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAgencyName(user.agencyName || ''); 
      if (user.avatarUrl) setPreview(`${api.defaults.baseURL.replace('/api', '')}${user.avatarUrl}`);
    }
  }, [user]);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file); setPreview(URL.createObjectURL(file)); setRemoveAvatar(false); 
  }

  function handleRemoveAvatar() {
    setAvatar(null); setPreview(''); setRemoveAvatar(true); 
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name); formData.append('email', email); formData.append('agencyName', agencyName); 
    if (oldPassword && newPassword) { formData.append('oldPassword', oldPassword); formData.append('newPassword', newPassword); }
    if (avatar) formData.append('avatar', avatar);
    if (removeAvatar) formData.append('removeAvatar', 'true');

    const tId = toast.loading('A atualizar perfil...');
    try {
      const response = await api.put('/profile', formData);
      if (updateUserData) updateUserData(response.data);
      else localStorage.setItem('@BusinessFlow:user', JSON.stringify(response.data));
      setOldPassword(''); setNewPassword(''); setRemoveAvatar(false);
      toast.success('Perfil atualizado!', { id: tId });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) { toast.error(error.response?.data?.error || 'Erro.', { id: tId }); }
  }

  function handleOpenNewCompany() { setEditingCompanyId(null); setCompanyName(''); setCompanyDocument(''); setIsCompanyModalOpen(true); }
  function handleEditCompany(company) { setEditingCompanyId(company.id); setCompanyName(company.name); setCompanyDocument(company.document || ''); setIsCompanyModalOpen(true); }

  async function handleDeleteCompany(id) {
    if (!window.confirm("CUIDADO: Excluir esta empresa apagará TODOS os dados dela. Continuar?")) return;
    const tId = toast.loading('A excluir empresa...');
    try { await api.delete(`/companies/${id}`); toast.success("Excluída!", { id: tId }); mutateCompanies(); setTimeout(() => window.location.reload(), 1500); } 
    catch(err) { toast.error("Erro ao excluir.", { id: tId }); }
  }

  async function handleSaveCompany(e) {
    e.preventDefault();
    const tId = toast.loading('A salvar empresa...');
    try {
      const payload = { name: companyName, document: companyDocument };
      if (editingCompanyId) await api.put(`/companies/${editingCompanyId}`, payload);
      else await api.post('/companies', payload);
      toast.success('Salva!', { id: tId }); setIsCompanyModalOpen(false); mutateCompanies(); setTimeout(() => window.location.reload(), 1500); 
    } catch(err) { toast.error('Erro.', { id: tId }); }
  }

  // 🔥 FUNÇÕES DE ACESSO DO CLIENTE
  function handleOpenAccess(company) {
    setActiveCompanyForAccess(company);
    setAccessForm({ name: '', email: '', password: '' });
  }

  async function handleGenerateAccess(e) {
    e.preventDefault();
    const tId = toast.loading('A gerar credenciais...');
    try {
      await api.post('/auth/client-account', { ...accessForm, companyId: activeCompanyForAccess.id });
      toast.success('Acesso gerado!', { id: tId });
      setAccessForm({ name: '', email: '', password: '' }); // Limpa o formulário, mas mantém o modal aberto
      mutateAccesses(); // Atualiza a lista na hora!
    } catch (err) { toast.error(err.response?.data?.error || 'Erro ao gerar acesso.', { id: tId }); }
  }

  async function handleRevokeAccess(userId) {
    if (!window.confirm("Tem certeza que deseja revogar o acesso deste cliente? Ele será desconectado na hora.")) return;
    const tId = toast.loading('A revogar acesso...');
    try {
      await api.delete(`/auth/client-account/${userId}`);
      toast.success('Acesso revogado!', { id: tId });
      mutateAccesses(); // Some da lista na hora!
    } catch (err) { toast.error('Erro ao revogar acesso.', { id: tId }); }
  }

  return (
    <Container>
      <Header>
        <h1>Minhas Configurações</h1>
        <p>Gerencie o perfil do seu Escritório e o acesso dos seus clientes.</p>
      </Header>

      <ProfileCard>
        <form onSubmit={handleProfileSubmit}>
          <AvatarSection>
            <div className="avatar-container">
              {preview ? <img src={preview} alt="Avatar" /> : <div className="placeholder"><CircleUser size={90} color="#cbd5e0" strokeWidth={1} /></div>}
            </div>
            <div className="upload-btn">
              <Upload size={14} style={{ marginRight: 6 }} /> Alterar Logo
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
            </div>
          </AvatarSection>
          <FormGrid>
            <h3 style={{ color: '#3182ce', fontWeight: 800 }}>Dados do Escritório (Agência)</h3>
            <FormGroup><label>Nome do Escritório</label><input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Ex: Contabilidade X" /></FormGroup>

            <h3 style={{ marginTop: 24 }}>Dados do Gestor (Seu Login)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup><label>Nome</label><input value={name} onChange={e => setName(e.target.value)} required /></FormGroup>
                <FormGroup><label>E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></FormGroup>
            </div>
          </FormGrid>
          <ActionButton type="submit">Salvar Perfil</ActionButton>
        </form>
      </ProfileCard>

      <SectionTitle><Building2 size={24} color="#3182ce" /> Minhas Empresas e Acessos</SectionTitle>
      
      <ProfileCard style={{ padding: '24px' }}>
        <CompanyList>
          {!userCompanies ? <p style={{ color: '#a0aec0' }}>A carregar...</p> : userCompanies.map(comp => (
             <CompanyItem key={comp.id}>
                <div className="info"><strong>{comp.name}</strong><span>{comp.document || 'Sem Documento'}</span></div>
                <div className="actions">
                   <button type="button" onClick={() => handleOpenAccess(comp)} title="Gerir Acessos do Cliente" style={{ color: '#805ad5', borderColor: '#e9d8fd', background: '#faf5ff' }}>
                     <Key size={18} /> Acessos
                   </button>
                   <button type="button" onClick={() => handleEditCompany(comp)}><Edit size={18} /></button>
                   <button type="button" className="delete" onClick={() => handleDeleteCompany(comp.id)}><Trash2 size={18} /></button>
                </div>
             </CompanyItem>
          ))}
          <AddButton type="button" onClick={handleOpenNewCompany}><Plus size={20} /> Cadastrar Nova Empresa</AddButton>
        </CompanyList>
      </ProfileCard>

      {/* MODAL DE EMPRESA */}
      {isCompanyModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>{editingCompanyId ? 'Editar' : 'Nova'} Empresa</h2>
            <form onSubmit={handleSaveCompany}>
              <FormGrid>
                <FormGroup><label>Nome</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} required /></FormGroup>
                <FormGroup><label>Documento</label><input value={companyDocument} onChange={e => setCompanyDocument(e.target.value)} /></FormGroup>
              </FormGrid>
              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsCompanyModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Salvar</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 🔥 MODAL AVANÇADO DE GESTÃO DE ACESSOS */}
      {activeCompanyForAccess && (
        <ModalOverlay>
          <ModalContent style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
               <h2 style={{ margin: 0 }}>Acessos: {activeCompanyForAccess.name}</h2>
               <button onClick={() => setActiveCompanyForAccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#a0aec0" /></button>
            </div>

            {/* LISTA DE UTILIZADORES CADASTRADOS */}
            <h3 style={{ fontSize: 13, color: '#4a5568', textTransform: 'uppercase', marginBottom: 12, fontWeight: 800 }}>Usuários com Acesso Ativo</h3>
            <div style={{ background: '#f7fafc', borderRadius: 8, border: '1px solid #edf2f7', padding: 16, marginBottom: 32, maxHeight: 200, overflowY: 'auto' }}>
              {!clientAccesses ? (
                <p style={{ fontSize: 14, color: '#a0aec0' }}>A carregar...</p>
              ) : clientAccesses.length === 0 ? (
                <p style={{ color: '#a0aec0', fontSize: 14, margin: 0 }}>Nenhum acesso gerado para esta empresa.</p>
              ) : (
                clientAccesses.map(client => (
                  <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: 14, color: '#2d3748' }}>{client.name}</strong>
                      <span style={{ fontSize: 12, color: '#718096' }}>{client.email}</span>
                    </div>
                    <button onClick={() => handleRevokeAccess(client.id)} title="Revogar Acesso Definitivamente" style={{ background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', padding: 8, borderRadius: 6, cursor: 'pointer', transition: '0.2s' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* FORMULÁRIO PARA NOVO ACESSO */}
            <h3 style={{ fontSize: 13, color: '#4a5568', textTransform: 'uppercase', marginBottom: 12, fontWeight: 800 }}>Gerar Novo Login</h3>
            <form onSubmit={handleGenerateAccess}>
              <FormGrid>
                <FormGroup><label>Nome do Cliente</label><input value={accessForm.name} onChange={e => setAccessForm({...accessForm, name: e.target.value})} required placeholder="Ex: João da Silva" /></FormGroup>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <FormGroup><label>E-mail (Login)</label><input type="email" value={accessForm.email} onChange={e => setAccessForm({...accessForm, email: e.target.value})} required placeholder="cliente@email.com" /></FormGroup>
                  <FormGroup><label>Senha Inicial</label><input type="password" value={accessForm.password} onChange={e => setAccessForm({...accessForm, password: e.target.value})} required placeholder="Defina uma senha" /></FormGroup>
                </div>
              </FormGrid>
              <ModalActions style={{ marginTop: 16 }}>
                <button type="submit" className="save" style={{ background: '#805ad5', width: '100%' }}>Criar Credenciais</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

    </Container>
  );
}