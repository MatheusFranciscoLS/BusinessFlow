import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom'; // <--- Importante
import { useAuth } from '../../contexts/AuthContext'; 
import { 
  Container, LeftPanel, RightPanel, FormContainer, Form, InputGroup, Button, FooterActions 
} from './styles';

export default function Login() {
  const { signIn } = useAuth(); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) return toast.error("Preencha todos os campos");

    setLoading(true);
    const loginPromise = signIn({ email, password });

    toast.promise(loginPromise, {
      loading: 'Acessando...',
      success: 'Bem-vindo!',
      error: (err) => err.response?.data?.error || 'Falha no login.'
    });

    try {
      await loginPromise;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <LeftPanel>
        <h1>Business<span>Flow</span></h1>
        <p>Gerencie seus clientes, financeiro e serviços em um único lugar.</p>
      </LeftPanel>

      <RightPanel>
        <FormContainer>
          <h2>Bem-vindo de volta!</h2>
          <p>Insira suas credenciais para acessar.</p>

          <Form onSubmit={handleLogin}>
            <InputGroup>
              <label>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </InputGroup>

            <InputGroup>
              <label>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </InputGroup>

            <Button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </Form>

          {/* --- LINKS NOVOS --- */}
          <FooterActions>
            <Link to="/forgot-password">Esqueceu sua senha?</Link>
            <Link to="/register" className="bold">Não tem conta? Crie agora</Link>
          </FooterActions>

        </FormContainer>
      </RightPanel>
    </Container>
  );
}