import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container, LeftPanel, RightPanel, FormContainer, Form, InputGroup, Button, FooterActions,
  MobileLogo
} from './styles';
import { ShieldCheck } from 'lucide-react';
import useSWR from 'swr';
import api from '../../services/api';
import { retryWhileWaking } from './demoAccess';

export default function Login() {
  const { signIn, signInDemo } = useAuth();
  // O link de cadastro só aparece quando o servidor está com o cadastro aberto.
  // O carregamento do servidor é tratado à parte: as opções da demonstração não dependem dele.
  const { data: config, error: configError } = useSWR(
    '/auth/config',
    (url) => api.get(url, { timeout: 15000 }).then((res) => res.data),
    { errorRetryInterval: 4000, errorRetryCount: 20 },
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  // Se o servidor demora a responder (hospedagem gratuita acordando), avisa em vez de esconder a demonstração.
  useEffect(() => {
    if (config) {
      setSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), 3000);
    return () => clearTimeout(timer);
  }, [config]);

  const serverWaking = !config && (slow || !!configError);
  const showDemo = config?.demoEnabled !== false; // só some se o servidor disser que a demonstração está desligada

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

  async function openDemo(profile) {
    if (demoLoading) return;
    setDemoLoading(true);
    const toastId = toast.loading('Abrindo a demonstração...');
    try {
      await retryWhileWaking(() => signInDemo(profile), {
        onWait: (attempt, total) => toast.loading(
          `Aguardando o servidor iniciar... tentativa ${attempt + 1} de ${total}`,
          { id: toastId },
        ),
      });
      toast.success('Bem-vindo à demonstração!', { id: toastId });
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'O servidor ainda não respondeu. Tente de novo em instantes.',
        { id: toastId },
      );
    } finally {
      setDemoLoading(false);
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
          <MobileLogo>Business<span>Flow</span></MobileLogo>

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

          {showDemo && (
            <div style={{ marginTop: 20, padding: 16, border: '1px dashed #90cdf4', background: '#ebf8ff', borderRadius: 12, textAlign: 'center' }}>
              <strong style={{ color: '#2c5282' }}>Quer só conhecer o sistema?</strong>
              <p style={{ margin: '4px 0 12px 0', color: '#4a5568', fontSize: 13 }}>
                Entre na demonstração: dados fictícios, somente leitura, sem senha.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[['gestor', 'Como gestor do escritório'], ['cliente', 'Como cliente (portal)']].map(([profile, label]) => (
                  <button
                    key={profile}
                    type="button"
                    disabled={demoLoading}
                    onClick={() => openDemo(profile)}
                    style={{ background: 'white', color: '#2b6cb0', border: '1px solid #90cdf4', borderRadius: 8, padding: '10px 14px', fontWeight: 700, cursor: demoLoading ? 'wait' : 'pointer', opacity: demoLoading ? 0.7 : 1 }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {serverWaking && (
                <p role="status" style={{ margin: '12px 0 0 0', color: '#4a5568', fontSize: 12 }}>
                  O servidor de demonstração está iniciando (hospedagem gratuita) e pode levar cerca de 1 minuto.
                  Você já pode clicar: a demonstração abre assim que ele responder.
                </p>
              )}
            </div>
          )}

          <FooterActions>
            <Link to="/forgot-password">Esqueceu-se da sua senha?</Link>
            {config?.registrationOpen && (
              <span style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                Ainda não é parceiro? <Link to="/register">Registe o seu Escritório</Link>
              </span>
            )}
          </FooterActions>
        </FormContainer>
      </RightPanel>
    </Container>
  );
}
