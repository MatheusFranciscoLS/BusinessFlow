import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { 
  Container, LeftPanel, RightPanel, FormContainer, Form, InputGroup, Button, FooterActions 
} from './styles';
import { ShieldCheck } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth(); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) return toast.error("Preencha todos os campos obrigatórios.");

    setLoading(true);
    const loginPromise = signIn({ email, password });

    toast.promise(loginPromise, {
      loading: 'A autenticar credenciais...',
      success: 'Bem-vindo ao BusinessFlow!',
      error: (err) => err.response?.data?.error || 'Falha ao iniciar sessão. Verifique os dados.'
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
        <p>A plataforma definitiva para Gestão Contábil, BPO Financeiro e Relacionamento com o Cliente.</p>
      </LeftPanel>

      <RightPanel>
        <FormContainer>
          <h2>Bem-vindo de volta!</h2>
          <p>Insira as suas credenciais para aceder ao portal.</p>

          <Form onSubmit={handleLogin}>
            <InputGroup>
              <label>E-mail Corporativo</label>
              <input 
  type="email" 
  value={email} 
  onChange={e => setEmail(e.target.value.trim().toLowerCase())} 
  placeholder="contato@empresa.com" 
/>
            </InputGroup>

            <InputGroup>
              <label>Senha de Acesso</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </InputGroup>

<Button type="submit" disabled={loading}>
              {loading ? 'A entrar no sistema...' : 'Entrar na Plataforma'}
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, color: '#718096', fontSize: 12, fontWeight: 600 }}>
               <ShieldCheck size={16} color="#38a169" /> Ambiente Seguro e Criptografado
            </div>
          </Form>

          <FooterActions>
            <Link to="/forgot-password">Esqueceu-se da sua senha?</Link>
            <span style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              Ainda não é parceiro? <Link to="/register">Registe o seu Escritório</Link>
            </span>
          </FooterActions>
        </FormContainer>
      </RightPanel>
    </Container>
  );
}