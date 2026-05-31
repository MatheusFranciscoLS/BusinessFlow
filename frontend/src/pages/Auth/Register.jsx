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
  const [agencyName, setAgencyName] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    if (!name || !agencyName || !email || !password) return toast.error("Preencha todos os campos obrigatórios!");
    if (password.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres de segurança.");

    setLoading(true);
    try {
      await api.post('/auth/register', { name, agencyName, email, password });
      
      toast.success("Escritório cadastrado com sucesso! Faça o Login.");
      navigate('/'); 
    } catch (error) {
      const msg = error.response?.data?.error || "Erro crítico ao registrar a agência.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <LeftPanel>
        <h1>Junte-se ao Business<span>Flow</span></h1>
        <p>Eleve o seu escritório de contabilidade para o próximo nível com o nosso ecossistema integrado.</p>
      </LeftPanel>

      <RightPanel>
        <FormContainer style={{ maxWidth: 450 }}>
          <h2>Criar Nova Conta</h2>
          <p>Configure o ambiente inicial do seu escritório.</p>

          <Form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InputGroup>
                <label>Seu Nome (Sócio/Gestor)</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" />
              </InputGroup>

              <InputGroup>
                <label>Nome do Escritório</label>
                <input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Ex: JS Contabilidade" />
              </InputGroup>
            </div>

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
              <label>Senha Mestre de Acesso</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </InputGroup>

            <Button type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'A configurar ambiente de dados...' : 'Criar Conta Gratuita'}
            </Button>
          </Form>

          <FooterActions>
            <span style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              Já possui uma conta ativa? <Link to="/">Fazer Login</Link>
            </span>
          </FooterActions>
        </FormContainer>
      </RightPanel>
    </Container>
  );
}