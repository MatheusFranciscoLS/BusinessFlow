import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  CircleUser, Upload, Trash2, Building2, Plus, Edit, Key, X, Shield, Users, FileText 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Container, Header, ProfileCard, AvatarSection, FormGrid, FormGroup, ActionButton,
  SectionTitle, CompanyList, CompanyItem, AddButton, ModalOverlay, ModalContent, ModalActions
} from './styles';
import { maskCPFOrCNPJ } from '../../utils/masks';

const fetcher = url => api.get(url).then(res => res.data);

export default function Profile() {
  const { user, updateUserData } = useAuth(); 
  
  // -- ESTADOS DO PERFIL DO GESTOR --
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agencyName, setAgencyName] = useState(''); 
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);

  // -- ESTADOS DE EMPRESAS DA AGÊNCIA --
  const { data: userCompanies, mutate: mutateCompanies } = useSWR('/companies', fetcher);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyDocument, setCompanyDocument] = useState('');

  // -- ESTADOS DE ACESSOS (RBAC / PORTAL DO CLIENTE) --
  const [activeCompanyForAccess, setActiveCompanyForAccess] = useState(null);
  const [accessForm, setAccessForm] = useState({ name: '', email: '', password: '' });

  const { data: clientAccesses, mutate: mutateAccesses } = useSWR(
    activeCompanyForAccess ? `/auth/client-account/${activeCompanyForAccess.id}` : null, 
    fetcher
  );

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
    formData.append('agencyName', agencyName); 
    
    if (oldPassword && newPassword) { 
      formData.append('oldPassword', oldPassword); 
      formData.append('newPassword', newPassword); 
    }
    
    if (avatar) formData.append('avatar', avatar);
    if (removeAvatar) formData.append('removeAvatar', 'true');

    const tId = toast.loading('A atualizar o perfil da agência...');
    try {
      const response = await api.put('/profile', formData);
      if (updateUserData) {
        updateUserData(response.data);
      } else {
        localStorage.setItem('@BusinessFlow:user', JSON.stringify(response.data));
      }
      
      setOldPassword(''); 
      setNewPassword(''); 
      setRemoveAvatar(false);
      
      toast.success('Perfil atualizado com sucesso!', { id: tId });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) { 
      toast.error(error.response?.data?.error || 'Erro ao atualizar.', { id: tId }); 
    }
  }

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
    if (!window.confirm("ATENÇÃO: Excluir esta empresa apagará permanentemente TODO o financeiro, DRE e configurações vinculadas a ela. Tem a certeza absoluta?")) return;
    const tId = toast.loading('A excluir a empresa...');
    try { 
      await api.delete(`/companies/${id}`); 
      toast.success("Empresa excluída permanentemente!", { id: tId }); 
      mutateCompanies(); 
      setTimeout(() => window.location.reload(), 1500); 
    } catch(err) { 
      toast.error("Erro ao excluir a empresa.", { id: tId }); 
    }
  }

  async function handleSaveCompany(e) {
    e.preventDefault();
    const tId = toast.loading('A guardar dados da empresa...');
    try {
      const payload = { name: companyName, document: companyDocument };
      if (editingCompanyId) {
        await api.put(`/companies/${editingCompanyId}`, payload);
      } else {
        await api.post('/companies', payload);
      }
      toast.success('Empresa salva com sucesso!', { id: tId }); 
      setIsCompanyModalOpen(false); 
      mutateCompanies(); 
      setTimeout(() => window.location.reload(), 1500); 
    } catch(err) { 
      toast.error('Erro ao salvar os dados.', { id: tId }); 
    }
  }

  function handleOpenAccess(company) { 
    setActiveCompanyForAccess(company); 
    setAccessForm({ name: '', email: '', password: '' }); 
  }

  async function handleGenerateAccess(e) {
    e.preventDefault();
    const tId = toast.loading('A encriptar e gerar credenciais...');
    try {
      await api.post('/auth/client-account', { ...accessForm, companyId: activeCompanyForAccess.id });
      toast.success('Acesso concedido com sucesso!', { id: tId }); 
      setAccessForm({ name: '', email: '', password: '' }); 
      mutateAccesses(); 
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Erro ao gerar acesso.', { id: tId }); 
    }
  }

  async function handleRevokeAccess(userId) {
    if (!window.confirm("Atenção: Tem certeza que deseja revogar o acesso deste cliente? Ele não poderá mais entrar no Portal do Cliente.")) return;
    const tId = toast.loading('A revogar o acesso do sistema...');
    try { 
      await api.delete(`/auth/client-account/${userId}`); 
      toast.success('Acesso bloqueado com sucesso!', { id: tId }); 
      mutateAccesses(); 
    } catch (err) { 
      toast.error('Erro ao revogar o acesso.', { id: tId }); 
    }
  }

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: 26, color: '#1a202c', fontWeight: 800 }}>
            Minhas Configurações
          </h1>
          <p style={{ margin: 0, color: '#718096' }}>
            Gerencie a identidade visual do seu Escritório e os acessos das suas empresas.
          </p>
        </div>
      </Header>

      <ProfileCard style={{ marginBottom: 40 }}>
        <form onSubmit={handleProfileSubmit}>
<AvatarSection style={{ padding: '32px', background: 'linear-gradient(135deg, #ebf8ff 0%, #f7fafc 100%)', borderRadius: 16, marginBottom: 32, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'row', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Círculo do Avatar Premium */}
            <div className="avatar-container" style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 15px -3px rgba(49,130,206,0.2)', flexShrink: 0 }}>
              {preview ? (
                <img src={preview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                  <Building2 size={50} color="#cbd5e0" strokeWidth={1.5} />
                </div>
              )}
            </div>
            
            {/* Controlos de Marca */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: 20, fontWeight: 800 }}>Identidade Visual (White Label)</h3>
                <p style={{ margin: 0, color: '#718096', fontSize: 14 }}>Esta é a marca oficial que os seus clientes verão no Portal e impressa nos Relatórios Financeiros (PDF).</p>
                
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                  <label style={{ cursor: 'pointer', background: '#3182ce', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s', boxShadow: '0 4px 6px rgba(49, 130, 206, 0.2)' }}>
                    <Upload size={18} /> Subir Nova Logo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                  </label>
                  
                  {preview && (
                    <button type="button" onClick={handleRemoveAvatar} style={{ background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', transition: '0.2s' }}>
                      Remover Marca
                    </button>
                  )}
                </div>
            </div>
          </AvatarSection>

          <FormGrid>
            <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #edf2f7' }}>
              <h3 style={{ color: '#2d3748', fontWeight: 800, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={20} color="#3182ce" />
                White Label (Dados da Agência)
              </h3>
              <FormGroup>
                <label>Nome do Escritório (Será exibido no DRE e PDF)</label>
                <input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Ex: Contabilidade Premium" />
              </FormGroup>
            </div>

            <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #edf2f7', marginTop: 24 }}>
              <h3 style={{ color: '#2d3748', fontWeight: 800, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={20} color="#38a169" />
                Segurança do Gestor (Seu Login)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <FormGroup>
                    <label>Nome Completo</label>
                    <input value={name} onChange={e => setName(e.target.value)} required />
                  </FormGroup>
                  <FormGroup>
                    <label>E-mail de Acesso</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      disabled 
                      title="O E-mail principal não pode ser alterado aqui." 
                      style={{ background: '#f7fafc', cursor: 'not-allowed' }} 
                    />
                  </FormGroup>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20, paddingTop: 20, borderTop: '1px dashed #e2e8f0' }}>
                  <FormGroup>
                    <label>Senha Atual (Deixe em branco para manter)</label>
                    <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="••••••" />
                  </FormGroup>
                  <FormGroup>
                    <label>Nova Senha</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••" />
                  </FormGroup>
              </div>
            </div>
          </FormGrid>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <ActionButton type="submit" style={{ padding: '16px 32px', fontSize: 16 }}>
              Gravar Alterações do Perfil
            </ActionButton>
          </div>
        </form>
      </ProfileCard>

      <SectionTitle style={{ fontSize: 22, fontWeight: 800, color: '#1a202c', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Building2 size={28} color="#3182ce" /> 
        Gestão Multi-Empresas e Portal do Cliente
      </SectionTitle>
      
      <ProfileCard style={{ padding: '32px', border: '1px solid #edf2f7', borderRadius: 16 }}>
<CompanyList>
          {!userCompanies ? (
            <p style={{ color: '#a0aec0', padding: 20, textAlign: 'center' }}>A carregar ecossistema...</p>
          ) : userCompanies.map(comp => (
             <CompanyItem key={comp.id}>
                <div className="info" style={{ marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ebf8ff', color: '#3182ce', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Building2 size={24} />
                  </div>
                  <strong style={{ display: 'block', fontSize: 18, color: '#2d3748', fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{comp.name}</strong>
                  <span style={{ fontSize: 13, color: '#718096', display: 'flex', alignItems: 'center', gap: 6, background: '#f7fafc', padding: '6px 10px', borderRadius: 6, width: 'fit-content' }}>
                    <FileText size={14} /> {maskCPFOrCNPJ(comp.document) || 'CNPJ Não Cadastrado'}
                  </span>
                </div>
                
                {/* Botões reorganizados no rodapé do cartão */}
                <div className="actions" style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #edf2f7', paddingTop: 16 }}>
                   <button type="button" onClick={() => handleOpenAccess(comp)} title="Gerir Acessos do Portal do Cliente" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '10px', borderRadius: 8, fontWeight: 700, color: '#805ad5', border: '1px solid #e9d8fd', background: '#faf5ff', cursor: 'pointer', transition: '0.2s' }}>
                     <Users size={18} /> Acessos
                   </button>
                   <button type="button" onClick={() => handleEditCompany(comp)} title="Editar Estrutura" style={{ padding: '10px', borderRadius: 8, background: '#f7fafc', border: '1px solid #e2e8f0', color: '#4a5568', cursor: 'pointer', transition: '0.2s' }}>
                     <Edit size={18} />
                   </button>
                   <button type="button" onClick={() => handleDeleteCompany(comp.id)} title="Excluir Definitivamente" style={{ padding: '10px', borderRadius: 8, background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', cursor: 'pointer', transition: '0.2s' }}>
                     <Trash2 size={18} />
                   </button>
                </div>
             </CompanyItem>
          ))}
          
          {/* O Botão de Nova Empresa agora é um Cartão elegante na Grelha! */}
          <AddButton type="button" onClick={handleOpenNewCompany}>
            <div style={{ background: 'white', padding: 16, borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: 8 }}>
              <Plus size={32} color="#3182ce" />
            </div>
            Cadastrar Nova Empresa
            <span style={{ fontSize: 13, color: '#718096', fontWeight: 500 }}>Adicionar Filial ou Matriz</span>
          </AddButton>
        </CompanyList>
      </ProfileCard>

      {/* MODAL DE EDIÇÃO DE EMPRESA */}
      {isCompanyModalOpen && (
        <ModalOverlay>
          <ModalContent style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 24, color: '#2d3748' }}>
              {editingCompanyId ? 'Editar Dados da Empresa' : 'Adicionar Nova Empresa'}
            </h2>
            <form onSubmit={handleSaveCompany}>
              <FormGrid>
                <FormGroup>
                  <label>Razão Social / Nome de Exibição</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Ex: BusinessFlow Consultoria" />
                </FormGroup>
<FormGroup>
  <label>CNPJ</label>
  <input 
    value={companyDocument} 
    onChange={e => setCompanyDocument(maskCPFOrCNPJ(e.target.value))} 
    placeholder="00.000.000/0001-00" 
    maxLength={18}
  />
</FormGroup>
              </FormGrid>
              <ModalActions style={{ marginTop: 32 }}>
                <button type="button" className="cancel" onClick={() => setIsCompanyModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Confirmar Estrutura</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 🔥 MODAL AVANÇADO DE GESTÃO DE ACESSOS (RBAC) */}
      {activeCompanyForAccess && (
        <ModalOverlay>
          <ModalContent style={{ maxWidth: 650, background: '#f8fafc', padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
               <div>
                 <h2 style={{ margin: '0 0 8px 0', color: '#1a202c', display: 'flex', alignItems: 'center', gap: 10 }}>
                   <Key color="#805ad5" /> Gestão de Acessos
                 </h2>
                 <p style={{ margin: 0, color: '#718096' }}>
                   Controle quem pode entrar no Portal do Cliente da empresa <strong>{activeCompanyForAccess.name}</strong>.
                 </p>
               </div>
               <button onClick={() => setActiveCompanyForAccess(null)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: 8, borderRadius: 8, cursor: 'pointer' }}>
                 <X size={20} color="#a0aec0" />
               </button>
            </div>

            <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 32 }}>
              <h3 style={{ fontSize: 13, color: '#4a5568', textTransform: 'uppercase', marginBottom: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} /> Pessoas com Acesso Liberado
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 250, overflowY: 'auto' }}>
                {!clientAccesses ? (
                  <p style={{ fontSize: 14, color: '#a0aec0', textAlign: 'center', padding: 20 }}>A carregar base de segurança...</p>
                ) : clientAccesses.length === 0 ? (
                  <p style={{ color: '#a0aec0', fontSize: 14, margin: 0, textAlign: 'center', padding: 30, background: '#f7fafc', borderRadius: 8, border: '1px dashed #cbd5e0' }}>
                    O Portal do Cliente está vazio. Gere as credenciais abaixo para os sócios desta empresa.
                  </p>
                ) : (
                  clientAccesses.map(client => (
                    <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e9d8fd', color: '#553c9a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: 15, color: '#2d3748' }}>{client.name}</strong>
                          <span style={{ fontSize: 13, color: '#718096' }}>{client.email}</span>
                        </div>
                      </div>
                      <button onClick={() => handleRevokeAccess(client.id)} title="Revogar e Expulsar do Sistema" style={{ background: 'white', color: '#e53e3e', border: '1px solid #fed7d7', padding: '10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(229, 62, 62, 0.1)' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 13, color: '#4a5568', textTransform: 'uppercase', marginBottom: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} /> Autorizar Nova Pessoa
              </h3>
              <form onSubmit={handleGenerateAccess}>
                <FormGrid>
                  <FormGroup>
                    <label>Nome do Sócio / Funcionário</label>
                    <input value={accessForm.name} onChange={e => setAccessForm({...accessForm, name: e.target.value})} required placeholder="Ex: João da Silva" />
                  </FormGroup>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <FormGroup>
                      <label>E-mail de Login</label>
                      <input type="email" value={accessForm.email} onChange={e => setAccessForm({...accessForm, email: e.target.value})} required placeholder="cliente@email.com" />
                    </FormGroup>
                    <FormGroup>
                      <label>Definir Senha Inicial</label>
                      <input type="password" value={accessForm.password} onChange={e => setAccessForm({...accessForm, password: e.target.value})} required placeholder="Mínimo 6 caracteres" />
                    </FormGroup>
                  </div>
                </FormGrid>
                <ModalActions style={{ marginTop: 24 }}>
                  <button type="submit" className="save" style={{ background: '#805ad5', width: '100%', padding: '16px', fontSize: 16 }}>
                    Gerar e Enviar Credenciais de Acesso
                  </button>
                </ModalActions>
              </form>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

    </Container>
  );
}