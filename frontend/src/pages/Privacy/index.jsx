import React, { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { ShieldCheck, Download, CheckCircle, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const fetcher = (url) => api.get(url).then((res) => res.data);

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 };
const button = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 };

export default function Privacy() {
  const { user, signOut } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const { data: terms, mutate } = useSWR('/privacy/terms', fetcher);
  const [password, setPassword] = useState('');

  async function handleDownload() {
    try {
      const { data } = await api.get('/privacy/export', { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'meus-dados-businessflow.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível baixar os seus dados.');
    }
  }

  async function handleAccept() {
    try {
      await api.post('/privacy/terms/accept');
      toast.success('Aceite registrado.');
      mutate();
    } catch {
      toast.error('Não foi possível registrar o aceite.');
    }
  }

  async function handleRevoke(e) {
    e.preventDefault();
    if (!window.confirm('Apagar o seu acesso ao portal? Essa ação não pode ser desfeita.')) return;
    try {
      await api.delete('/privacy/account', { data: { password } });
      toast.success('Seu acesso foi apagado.');
      signOut();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível apagar o acesso.');
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 8px 0', color: '#1a202c' }}>
        <ShieldCheck color="#3182ce" size={32} /> Privacidade e seus dados
      </h1>
      <p style={{ color: '#718096', margin: '0 0 24px 0' }}>Como o BusinessFlow trata os seus dados e o que você pode fazer com eles.</p>

      <div style={{ ...card, background: '#fffaf0', borderColor: '#fbd38d' }}>
        <strong style={{ color: '#975a16' }}>Texto em rascunho.</strong>{' '}
        <span style={{ color: '#744210' }}>
          Este resumo descreve o que o sistema faz hoje, mas ainda precisa de revisão de um advogado antes de ser usado com clientes reais.
        </span>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Que dados o sistema guarda</h3>
        <ul style={{ color: '#4a5568', lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
          <li>Cadastro: nome, e-mail, CPF/CNPJ, telefone, regime tributário e honorário combinado.</li>
          <li>Lançamentos financeiros, comprovantes e documentos enviados ao cofre.</li>
          <li>Chamados, mensagens e tarefas ligadas ao cliente.</li>
          <li>Registro de acesso e de ações importantes (por exemplo, o IP e a data de uma assinatura eletrônica).</li>
        </ul>
        <h3>Quem vê</h3>
        <p style={{ color: '#4a5568', lineHeight: 1.7, margin: 0 }}>
          O escritório de contabilidade responsável pela sua conta e você. Cada cliente do portal vê somente os próprios dados.
        </p>
        <h3>Seus direitos</h3>
        <p style={{ color: '#4a5568', lineHeight: 1.7, margin: 0 }}>
          Você pode baixar uma cópia dos seus dados, pedir correção ao escritório e, no portal do cliente, apagar o seu acesso. Os registros contábeis e fiscais ficam com o escritório pelo tempo que a lei exigir.
        </p>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Termos e política de privacidade</h3>
        {terms?.upToDate ? (
          <p style={{ color: '#38a169', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, margin: 0 }}>
            <CheckCircle size={18} /> Aceito em {new Date(terms.acceptedAt).toLocaleDateString('pt-BR')}.
          </p>
        ) : (
          <button onClick={handleAccept} style={{ ...button, background: '#3182ce', color: 'white' }}>
            <CheckCircle size={18} /> Li e aceito os termos
          </button>
        )}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Meus dados</h3>
        <p style={{ color: '#4a5568', marginTop: 0 }}>Baixe um arquivo com os dados que o sistema guarda sobre você.</p>
        <button onClick={handleDownload} style={{ ...button, background: '#edf2f7', color: '#2d3748' }}>
          <Download size={18} /> Baixar meus dados
        </button>
      </div>

      {isClient && (
        <form onSubmit={handleRevoke} style={{ ...card, borderColor: '#feb2b2' }}>
          <h3 style={{ marginTop: 0, color: '#c53030' }}>Apagar meu acesso ao portal</h3>
          <p style={{ color: '#4a5568', marginTop: 0 }}>
            Seu login é apagado agora. O seu cadastro e os registros contábeis continuam com o escritório. Digite a sua senha para confirmar.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
            autoComplete="current-password"
            style={{ padding: 12, borderRadius: 8, border: '1px solid #cbd5e0', marginRight: 12, minWidth: 220 }}
          />
          <button type="submit" style={{ ...button, background: '#e53e3e', color: 'white' }}>
            <Trash2 size={18} /> Apagar meu acesso
          </button>
        </form>
      )}
    </div>
  );
}
