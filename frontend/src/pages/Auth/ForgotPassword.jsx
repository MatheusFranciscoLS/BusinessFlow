import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../services/api'; // 🔥 A API ESTÁ LIGADA!
import { 
  Container, LeftPanel, RightPanel, FormContainer, Form, InputGroup, Button, FooterActions,MobileLogo 
} from './styles';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRecover(e) {
    e.preventDefault();
    if (!email) return toast.error("Digite o seu e-mail cadastrado.");

    setLoading(true);
    try {
      // 🔥 A MÁGICA: Conectando com a rota real de esquecimento de senha!
      await api.post('/auth/forgot-password', { email });
      toast.success("Se o e-mail existir, receberá um link de recuperação!");
      setEmail('');
    } catch (error) {
      toast.error(error.response?.data?.error || "Ocorreu uma falha ao solicitar a recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <LeftPanel>
        <h1>Recuperação de Conta</h1>
        <p>Não se preocupe, o sistema garante a integridade dos seus dados. Vamos ajudar a recuperar o seu acesso.</p>
      </LeftPanel>

      <RightPanel>
        <FormContainer>
          <MobileLogo>Business<span>Flow</span></MobileLogo>
          <h2>Esqueceu a sua senha?</h2>
          <p>Digite o seu e-mail para receber as instruções seguras.</p>

          <Form onSubmit={handleRecover}>
            <InputGroup>
              <label>E-mail cadastrado</label>
              <input 
  type="email" 
  value={email} 
  onChange={e => setEmail(e.target.value.trim().toLowerCase())} 
  placeholder="contato@empresa.com" 
/>
            </InputGroup>

            <Button type="submit" disabled={loading}>
              {loading ? 'A processar solicitação...' : 'Enviar Link de Recuperação'}
            </Button>
          </Form>

          <FooterActions>
            <Link to="/">Voltar para a página de Login</Link>
          </FooterActions>
        </FormContainer>
      </RightPanel>
    </Container>
  );
}