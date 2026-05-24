import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CircleUser, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Container, Header, ProfileCard, AvatarSection, FormGrid, FormGroup, ActionButton } from './styles';

export default function Profile() {
  const { user, updateUserData } = useAuth(); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false); // NOVO ESTADO

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
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
    setRemoveAvatar(false); // Se escolheu uma foto nova, cancela a ordem de remover
  }

  function handleRemoveAvatar() {
    setAvatar(null);
    setPreview('');
    setRemoveAvatar(true); // Ativa a ordem de apagar no banco de dados
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    
    if (oldPassword && newPassword) {
      formData.append('oldPassword', oldPassword);
      formData.append('newPassword', newPassword);
    }
    
    if (avatar) {
      formData.append('avatar', avatar);
    }
    
    // Se clicou no botão de lixeira, avisa o Back-end
    if (removeAvatar) {
      formData.append('removeAvatar', 'true');
    }

    const tId = toast.loading('A atualizar perfil...');
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
      
      // Um pequeno recarregamento de página para garantir que a foto atualiza no menu lateral imediatamente
      setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar dados.', { id: tId });
    }
  }

  return (
    <Container>
      <Header>
        <h1>Minhas Configurações</h1>
        <p>Gerencie suas credenciais de acesso e foto de perfil</p>
      </Header>

      <ProfileCard>
        <form onSubmit={handleSubmit}>
          <AvatarSection>
            <div className="avatar-container">
              {preview ? (
                <img src={preview} alt="Avatar" />
              ) : (
                <div className="placeholder">
                  <CircleUser size={90} color="#cbd5e0" strokeWidth={1} />
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="upload-btn">
                <Upload size={14} style={{ marginRight: 6 }} /> Alterar Foto
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </div>

              {/* Só mostra o botão de remover se existir uma foto (no banco ou no preview) */}
              {(preview || user?.avatarUrl) && (
                <button 
                  type="button" 
                  onClick={handleRemoveAvatar} 
                  style={{ 
                    background: '#fff5f5', color: '#e53e3e', border: 'none', 
                    padding: '10px 16px', borderRadius: '8px', fontSize: '13px', 
                    fontWeight: 600, cursor: 'pointer', display: 'flex', 
                    alignItems: 'center', gap: '6px', transition: '0.2s' 
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#fed7d7'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#fff5f5'}
                >
                  <Trash2 size={14} /> Remover
                </button>
              )}
            </div>
          </AvatarSection>

          <FormGrid>
            <h3>Dados Pessoais</h3>
            <FormGroup>
              <label>Nome Completo</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </FormGroup>
            <FormGroup>
              <label>E-mail Corporativo</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </FormGroup>

            <h3>Segurança (Opcional)</h3>
            <FormGroup>
              <label>Senha Atual</label>
              <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Digite sua senha antiga" />
            </FormGroup>
            <FormGroup>
              <label>Nova Senha</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </FormGroup>
          </FormGrid>

          <ActionButton type="submit">Salvar Alterações</ActionButton>
        </form>
      </ProfileCard>
    </Container>
  );
}