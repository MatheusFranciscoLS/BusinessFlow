import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  Container, LeftPanel, RightPanel, FormContainer, Form, InputGroup, Button, FooterActions 
} from './styles';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRecover(e) {
    e.preventDefault();
    if (!email) return toast.error("Digite seu e-mail");

    setLoading(true);
    // Simulação de envio (No futuro você conecta na API)
    setTimeout(() => {
      toast.success("Link de recuperação enviado para seu e-mail!");
      setLoading(false);
    }, 1500);
  }

  return (
    <Container>
      <LeftPanel>
        <h1>Recuperação de Conta</h1>
        <p>Não se preocupe, vamos ajudar você a recuperar seu acesso.</p>
      </LeftPanel>

      <RightPanel>
        <FormContainer>
          <h2>Esqueceu a senha?</h2>
          <p>Digite seu e-mail para receber as instruções.</p>

          <Form onSubmit={handleRecover}>
            <InputGroup>
              <label>E-mail cadastrado</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </InputGroup>

            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Link'}
            </Button>
          </Form>

          <FooterActions>
            <Link to="/" className="bold">Voltar para Login</Link>
          </FooterActions>

        </FormContainer>
      </RightPanel>
    </Container>
  );
}