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
  const [agencyName, setAgencyName] = useState(''); // 🔥 NOVO CAMPO
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    if (!name || !agencyName || !email || !password) return toast.error("Preencha todos os campos obrigatórios!");
    if (password.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres.");

    setLoading(true);
    try {
      // Chama a rota de registro do backend passando o nome da agência
      await api.post('/auth/register', { name, agencyName, email, password });
      
      toast.success("Escritório cadastrado com sucesso! Faça o Login.");
      navigate('/'); 
    } catch (error) {
      // Aqui a mágica acontece: mostra EXATAMENTE o erro do backend (ex: "E-mail já está em uso")
      const msg = error.response?.data?.error || "Erro de conexão com o servidor.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <LeftPanel>
        <h1>Junte-se ao Business<span>Flow</span></h1>
        <p>A plataforma definitiva para BPO Financeiro e Gestão Contábil. Modernize o seu escritório hoje mesmo.</p>
      </LeftPanel>

      <RightPanel>
        <FormContainer style={{ marginTop: 20 }}>
          <h2>Cadastre o seu Escritório</h2>
          <p>Preencha os dados abaixo para configurar o seu ambiente.</p>

          <Form onSubmit={handleRegister}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InputGroup>
                <label>Seu Nome (Gestor)</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" />
              </InputGroup>

              <InputGroup>
                <label>Nome do Escritório</label>
                <input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Ex: JS Contabilidade" />
              </InputGroup>
            </div>

            <InputGroup>
              <label>E-mail Corporativo</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@escritorio.com" />
            </InputGroup>

            <InputGroup>
              <label>Senha de Acesso</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </InputGroup>

            <Button type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'A configurar ambiente...' : 'Criar Conta Gratuita'}
            </Button>
          </Form>

          <FooterActions>
            <span>Já possui uma conta?</span>
            <Link to="/" className="bold">Fazer Login</Link>
          </FooterActions>

        </FormContainer>
      </RightPanel>
    </Container>
  );
}