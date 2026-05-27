import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CircleUser, Upload, Trash2, Building2, Plus, Edit, Key } from 'lucide-react'; // 🔥 Importamos a Key
import { useAuth } from '../../contexts/AuthContext';
import { 
  Container, Header, ProfileCard, AvatarSection, FormGrid, FormGroup, ActionButton,
  SectionTitle, CompanyList, CompanyItem, AddButton, ModalOverlay, ModalContent, ModalActions
} from './styles';

const fetcher = url => api.get(url).then(res => res.data);

export default function Profile() {
  const { user, updateUserData } = useAuth(); 
  
  // -- ESTADOS DO PERFIL (ADMIN) --
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

  // 🔥 ESTADOS DO GERADOR DE ACESSO (PORTAL DO CLIENTE) --
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessForm, setAccessForm] = useState({ name: '', email: '', password: '', companyId: '', companyName: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAgencyName(user.agencyName || ''); 
      if (user.avatarUrl) {
        setPreview(`${api.defaults.baseURL.replace('/api', '')}${user.avatarUrl}`);
      }
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
    formData.append('name', name);
    formData.append('email', email);
    formData.append('agencyName', agencyName); 
    
    if (oldPassword && newPassword) {
      formData.append('oldPassword', oldPassword);
      formData.append('newPassword', newPassword);
    }
    if (avatar) formData.append('avatar', avatar);
    if (removeAvatar) formData.append('removeAvatar', 'true');

    const tId = toast.loading('A atualizar perfil...');
    try {
      const response = await api.put('/profile', formData);
      if (updateUserData) updateUserData(response.data);
      else localStorage.setItem('@BusinessFlow:user', JSON.stringify(response.data));

      setOldPassword(''); setNewPassword(''); setRemoveAvatar(false);
      toast.success('Perfil atualizado com sucesso!', { id: tId });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) { toast.error(error.response?.data?.error || 'Erro ao atualizar dados.', { id: tId }); }
  }

  function handleOpenNewCompany() { setEditingCompanyId(null); setCompanyName(''); setCompanyDocument(''); setIsCompanyModalOpen(true); }
  function handleEditCompany(company) { setEditingCompanyId(company.id); setCompanyName(company.name); setCompanyDocument(company.document || ''); setIsCompanyModalOpen(true); }

  async function handleDeleteCompany(id) {
    if (!window.confirm("CUIDADO: Excluir esta empresa apagará TODOS os dados dela. Continuar?")) return;
    const tId = toast.loading('A excluir empresa...');
    try { await api.delete(`/companies/${id}`); toast.success("Empresa excluída!", { id: tId }); mutateCompanies(); setTimeout(() => window.location.reload(), 1500); } 
    catch(err) { toast.error("Erro ao excluir empresa.", { id: tId }); }
  }

  async function handleSaveCompany(e) {
    e.preventDefault();
    const tId = toast.loading('A salvar empresa...');
    try {
      const payload = { name: companyName, document: companyDocument };
      if (editingCompanyId) await api.put(`/companies/${editingCompanyId}`, payload);
      else await api.post('/companies', payload);
      toast.success('Empresa salva!', { id: tId }); setIsCompanyModalOpen(false); mutateCompanies(); setTimeout(() => window.location.reload(), 1500); 
    } catch(err) { toast.error('Erro ao salvar.', { id: tId }); }
  }

  // 🔥 FUNÇÕES DO GERADOR DE ACESSO
  function handleOpenAccess(company) {
    setAccessForm({ name: '', email: '', password: '', companyId: company.id, companyName: company.name });
    setIsAccessModalOpen(true);
  }

  async function handleGenerateAccess(e) {
    e.preventDefault();
    const tId = toast.loading('A gerar credenciais do cliente...');
    try {
      await api.post('/auth/client-account', accessForm);
      toast.success('Acesso gerado com sucesso!', { id: tId });
      setIsAccessModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao gerar acesso.', { id: tId });
    }
  }

  return (
    <Container>
      <Header>
        <h1>Minhas Configurações</h1>
        <p>Gerencie o perfil do seu Escritório e o acesso dos seus clientes.</p>
      </Header>

      {/* 1. DADOS DO ESCRITÓRIO */}
      <ProfileCard>
        <form onSubmit={handleProfileSubmit}>
          <AvatarSection>
            <div className="avatar-container">
              {preview ? <img src={preview} alt="Avatar" /> : <div className="placeholder"><CircleUser size={90} color="#cbd5e0" strokeWidth={1} /></div>}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="upload-btn">
                <Upload size={14} style={{ marginRight: 6 }} /> Alterar Logo
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </div>
            </div>
          </AvatarSection>

          <FormGrid>
            <h3 style={{ color: '#3182ce', fontWeight: 800 }}>Dados do Escritório (Agência)</h3>
            <FormGroup>
              <label>Nome do Escritório / Consultoria</label>
              <input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Ex: BusinessFlow Contabilidade" />
            </FormGroup>

            <h3 style={{ marginTop: 24 }}>Dados do Gestor (Seu Login)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup><label>Nome do Responsável</label><input value={name} onChange={e => setName(e.target.value)} required /></FormGroup>
                <FormGroup><label>E-mail de Acesso</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></FormGroup>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup><label>Senha Atual</label><input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Digite para alterar" /></FormGroup>
                <FormGroup><label>Nova Senha</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></FormGroup>
            </div>
          </FormGrid>
          <ActionButton type="submit">Salvar Perfil do Escritório</ActionButton>
        </form>
      </ProfileCard>

      {/* 2. GESTÃO DE CLIENTES E ACESSOS AO PORTAL */}
      <SectionTitle><Building2 size={24} color="#3182ce" /> Minhas Empresas e Acessos</SectionTitle>
      
      <ProfileCard style={{ padding: '24px' }}>
        <CompanyList>
          {!userCompanies ? (
             <p style={{ color: '#a0aec0' }}>A carregar empresas...</p>
          ) : userCompanies.map(comp => (
             <CompanyItem key={comp.id}>
                <div className="info">
                   <strong>{comp.name}</strong>
                   <span>{comp.document || 'Sem Documento'}</span>
                </div>
                <div className="actions">
                   {/* 🔥 BOTÃO MÁGICO PARA CRIAR A SENHA DO CLIENTE */}
                   <button type="button" onClick={() => handleOpenAccess(comp)} title="Gerar Login para o Cliente" style={{ color: '#805ad5', borderColor: '#e9d8fd', background: '#faf5ff' }}>
                     <Key size={18} /> Acesso
                   </button>
                   <button type="button" onClick={() => handleEditCompany(comp)} title="Editar Empresa"><Edit size={18} /></button>
                   <button type="button" className="delete" onClick={() => handleDeleteCompany(comp.id)} title="Excluir Empresa"><Trash2 size={18} /></button>
                </div>
             </CompanyItem>
          ))}
          <AddButton type="button" onClick={handleOpenNewCompany}>
             <Plus size={20} /> Cadastrar Nova Empresa no Sistema
          </AddButton>
        </CompanyList>
      </ProfileCard>

      {/* MODAL DE CADASTRAR EMPRESA */}
      {isCompanyModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>{editingCompanyId ? 'Editar' : 'Nova'} Empresa</h2>
            <form onSubmit={handleSaveCompany}>
              <FormGrid>
                <FormGroup><label>Nome da Empresa (Obrigatório)</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} required /></FormGroup>
                <FormGroup><label>Documento (CNPJ / NIF)</label><input value={companyDocument} onChange={e => setCompanyDocument(e.target.value)} /></FormGroup>
              </FormGrid>
              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsCompanyModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Salvar Empresa</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 🔥 MODAL DE GERAR ACESSO DO PORTAL DO CLIENTE */}
      {isAccessModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>Gerar Acesso ao Portal</h2>
            <p style={{ fontSize: 13, color: '#718096', marginBottom: 24 }}>Crie as credenciais para o dono da empresa <strong>{accessForm.companyName}</strong> aceder ao sistema.</p>
            <form onSubmit={handleGenerateAccess}>
              <FormGrid>
                <FormGroup><label>Nome do Cliente</label><input value={accessForm.name} onChange={e => setAccessForm({...accessForm, name: e.target.value})} required placeholder="Ex: João da Silva" /></FormGroup>
                <FormGroup><label>E-mail (Será o Login dele)</label><input type="email" value={accessForm.email} onChange={e => setAccessForm({...accessForm, email: e.target.value})} required placeholder="cliente@email.com" /></FormGroup>
                <FormGroup><label>Senha Inicial</label><input type="password" value={accessForm.password} onChange={e => setAccessForm({...accessForm, password: e.target.value})} required placeholder="Defina uma senha" /></FormGroup>
              </FormGrid>
              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsAccessModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save" style={{ background: '#805ad5' }}>Criar Credenciais</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

    </Container>
  );
}