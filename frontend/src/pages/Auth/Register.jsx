import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Container, LeftPanel, RightPanel, FormContainer, Form, InputGroup, Button, FooterActions 
} from './styles';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Preencha tudo!");

    setLoading(true);
    try {
      // Chama a rota de registro do seu backend
      await api.post('/auth/register', { name, email, password });
      toast.success("Conta criada! Faça login.");
      navigate('/'); // Manda pro login
    } catch (error) {
      const msg = error.response?.data?.error || "Erro ao criar conta.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <LeftPanel>
        <h1>Junte-se ao Business<span>Flow</span></h1>
        <p>Comece a organizar sua empresa hoje mesmo. É rápido e fácil.</p>
      </LeftPanel>

      <RightPanel>
        <FormContainer>
          <h2>Crie sua conta</h2>
          <p>Preencha os dados abaixo para começar.</p>

          <Form onSubmit={handleRegister}>
            <InputGroup>
              <label>Nome Completo</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
            </InputGroup>

            <InputGroup>
              <label>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </InputGroup>

            <InputGroup>
              <label>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </InputGroup>

            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Cadastrar'}
            </Button>
          </Form>

          <FooterActions>
            <span>Já tem uma conta?</span>
            <Link to="/" className="bold">Fazer Login</Link>
          </FooterActions>

        </FormContainer>
      </RightPanel>
    </Container>
  );
}