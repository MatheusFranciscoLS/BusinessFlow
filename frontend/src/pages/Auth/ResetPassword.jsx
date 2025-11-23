import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Para pegar os dados da URL
import api from '../../services/api';
import { 
  Container, LeftPanel, RightPanel, FormContainer, Form, InputGroup, Button 
} from './styles';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Pega o email e token direto da URL (daquele link que clicamos)
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) return toast.error("Senhas não conferem!");
    if (password.length < 6) return toast.error("Mínimo 6 caracteres.");

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, token, newPassword: password });
      toast.success("Senha alterada! Faça login.");
      navigate('/');
    } catch (error) {
      toast.error("Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <LeftPanel>
        <h1>Definir Nova Senha</h1>
        <p>Escolha uma senha segura para proteger sua conta.</p>
      </LeftPanel>

      <RightPanel>
        <FormContainer>
          <h2>Nova Senha</h2>
          <p>Para o usuário: <strong>{email}</strong></p>

          <Form onSubmit={handleReset}>
            <InputGroup>
              <label>Nova Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="******" autoFocus />
            </InputGroup>

            <InputGroup>
              <label>Confirmar Senha</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="******" />
            </InputGroup>

            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </Form>
        </FormContainer>
      </RightPanel>
    </Container>
  );
}