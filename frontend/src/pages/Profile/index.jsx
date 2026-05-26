import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CircleUser, Upload, Trash2, Building2, Plus, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Container, Header, ProfileCard, AvatarSection, FormGrid, FormGroup, ActionButton,
  SectionTitle, CompanyList, CompanyItem, AddButton, ModalOverlay, ModalContent, ModalActions
} from './styles';

// Tradutor do SWR para puxar as empresas na hora
const fetcher = url => api.get(url).then(res => res.data);

export default function Profile() {
  const { user, updateUserData } = useAuth(); 
  
  // -- ESTADOS DO PERFIL PESSOAL --
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);

  // -- ESTADOS DO GESTOR DE EMPRESAS --
  const { data: userCompanies, mutate: mutateCompanies } = useSWR('/companies', fetcher);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyDocument, setCompanyDocument] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      if (user.avatarUrl) {
        setPreview(`${api.defaults.baseURL.replace('/api', '')}${user.avatarUrl}`);
      }
    }
  }, [user]);

  // --- FUNÇÕES DO PERFIL ---
  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
    setRemoveAvatar(false); 
  }

  function handleRemoveAvatar() {
    setAvatar(null);
    setPreview('');
    setRemoveAvatar(true); 
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
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
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar dados.', { id: tId });
    }
  }

  // --- FUNÇÕES DO GESTOR DE EMPRESAS ---
  function handleOpenNewCompany() {
    setEditingCompanyId(null);
    setCompanyName('');
    setCompanyDocument('');
    setIsCompanyModalOpen(true);
  }

  function handleEditCompany(company) {
    setEditingCompanyId(company.id);
    setCompanyName(company.name);
    setCompanyDocument(company.document || '');
    setIsCompanyModalOpen(true);
  }

  async function handleDeleteCompany(id) {
    if (!window.confirm("CUIDADO: Excluir esta empresa apagará TODOS os clientes, finanças e agendamentos vinculados a ela. Continuar?")) return;
    
    const tId = toast.loading('A excluir empresa...');
    try {
      await api.delete(`/companies/${id}`);
      toast.success("Empresa excluída!", { id: tId });
      mutateCompanies(); // Atualiza a lista da tela na hora
      
      // Pequeno recarregamento para atualizar a lista no Menu Lateral (Contexto)
      setTimeout(() => window.location.reload(), 1500);
    } catch(err) { 
      toast.error("Erro ao excluir empresa.", { id: tId }); 
    }
  }

  async function handleSaveCompany(e) {
    e.preventDefault();
    const tId = toast.loading('A salvar empresa...');
    try {
      const payload = { name: companyName, document: companyDocument };
      
      if (editingCompanyId) {
        await api.put(`/companies/${editingCompanyId}`, payload);
      } else {
        await api.post('/companies', payload);
      }
      
      toast.success('Empresa salva com sucesso!', { id: tId });
      setIsCompanyModalOpen(false);
      mutateCompanies(); // Puxa os dados novos
      
      // Recarrega para que o novo nome/empresa apareça no Menu Lateral
      setTimeout(() => window.location.reload(), 1500); 
    } catch(err) { 
      toast.error('Erro ao salvar.', { id: tId }); 
    }
  }

  return (
    <Container>
      <Header>
        <h1>Minhas Configurações</h1>
        <p>Gerencie suas credenciais de acesso, foto de perfil e os seus clientes (Empresas).</p>
      </Header>

      {/* 1. CARTÃO DO PERFIL PESSOAL */}
      <ProfileCard>
        <form onSubmit={handleProfileSubmit}>
          <AvatarSection>
            <div className="avatar-container">
              {preview ? (
                <img src={preview} alt="Avatar" />
              ) : (
                <div className="placeholder"><CircleUser size={90} color="#cbd5e0" strokeWidth={1} /></div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="upload-btn">
                <Upload size={14} style={{ marginRight: 6 }} /> Alterar Foto
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </div>

              {(preview || user?.avatarUrl) && (
                <button type="button" onClick={handleRemoveAvatar} style={{ background: '#fff5f5', color: '#e53e3e', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s' }}>
                  <Trash2 size={14} /> Remover
                </button>
              )}
            </div>
          </AvatarSection>

          <FormGrid>
            <h3>Dados Pessoais (Gestor)</h3>
            <FormGroup>
              <label>Nome Completo</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </FormGroup>
            <FormGroup>
              <label>E-mail de Acesso</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </FormGroup>

            <h3>Segurança</h3>
            <FormGroup>
              <label>Senha Atual</label>
              <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Digite sua senha antiga para alterar" />
            </FormGroup>
            <FormGroup>
              <label>Nova Senha</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </FormGroup>
          </FormGrid>

          <ActionButton type="submit">Atualizar Meu Perfil</ActionButton>
        </form>
      </ProfileCard>

      {/* 2. GESTOR DE EMPRESAS (MULTI-TENANT) */}
      <SectionTitle>
        <Building2 size={24} color="#3182ce" /> Agência e Clientes
      </SectionTitle>
      
      <ProfileCard style={{ padding: '24px' }}>
        <CompanyList>
          {!userCompanies ? (
             <p style={{ color: '#a0aec0' }}>A carregar empresas...</p>
          ) : userCompanies.map(comp => (
             <CompanyItem key={comp.id}>
                <div className="info">
                   <strong>{comp.name}</strong>
                   <span>{comp.document || 'Sem Documento (CNPJ/NIF)'}</span>
                </div>
                <div className="actions">
                   <button type="button" onClick={() => handleEditCompany(comp)} title="Editar Empresa"><Edit size={18} /></button>
                   <button type="button" className="delete" onClick={() => handleDeleteCompany(comp.id)} title="Excluir Empresa"><Trash2 size={18} /></button>
                </div>
             </CompanyItem>
          ))}
          
          <AddButton type="button" onClick={handleOpenNewCompany}>
             <Plus size={20} /> Adicionar Nova Empresa (Cliente)
          </AddButton>
        </CompanyList>
      </ProfileCard>

      {/* MODAL DE EMPRESA */}
      {isCompanyModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>{editingCompanyId ? 'Editar' : 'Nova'} Empresa</h2>
            <form onSubmit={handleSaveCompany}>
              <FormGrid>
                <FormGroup>
                  <label>Nome da Empresa (Obrigatório)</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Ex: Padaria do João" />
                </FormGroup>
                <FormGroup>
                  <label>Documento (CNPJ / NIF / CPF)</label>
                  <input value={companyDocument} onChange={e => setCompanyDocument(e.target.value)} placeholder="Opcional" />
                </FormGroup>
              </FormGrid>
              
              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsCompanyModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Salvar Empresa</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

    </Container>
  );
}