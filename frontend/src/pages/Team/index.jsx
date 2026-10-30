import React, { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { UsersRound, UserPlus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const fetcher = (url) => api.get(url).then((res) => res.data);

const ROLE_LABELS = { OWNER: 'Dono', SOCIO: 'Sócio', ANALISTA: 'Analista' };
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 };
const input = { padding: 12, borderRadius: 8, border: '1px solid #cbd5e0', width: '100%', boxSizing: 'border-box' };

export default function Team() {
  const { selectedCompany } = useAuth();
  const { data, error, mutate } = useSWR(selectedCompany ? `/team?companyId=${selectedCompany.id}` : null, fetcher);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ANALISTA' });

  const yourRole = data?.yourRole;
  const isOwner = yourRole === 'OWNER';
  const canManage = yourRole === 'OWNER' || yourRole === 'SOCIO';

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await api.post('/team', form);
      toast.success('Pessoa adicionada à equipe.');
      setForm({ name: '', email: '', password: '', role: 'ANALISTA' });
      mutate();
    } catch (err) {
      const details = err.response?.data?.details;
      toast.error(details ? details.join(' ') : err.response?.data?.error || 'Não foi possível adicionar.');
    }
  }

  async function handleRemove(person) {
    if (!window.confirm(`Tirar ${person.name} da equipe? Se ela não tiver acesso a mais nada, o login é apagado.`)) return;
    try {
      await api.delete(`/team/${person.id}`);
      toast.success('Pessoa removida.');
      mutate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Não foi possível remover.');
    }
  }

  async function handleRole(person, role) {
    try {
      await api.put(`/team/${person.id}`, { role });
      toast.success('Perfil atualizado.');
      mutate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Não foi possível mudar o perfil.');
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 8px 0', color: '#1a202c' }}>
        <UsersRound color="#3182ce" size={32} /> Equipe do escritório
      </h1>
      <p style={{ color: '#718096', margin: '0 0 24px 0' }}>
        Quem trabalha nesta empresa. O <strong>sócio</strong> faz tudo, menos adicionar outros sócios. O <strong>analista</strong> cuida do dia a dia, mas não apaga registros nem vê a auditoria e as chaves de API.
      </p>

      {error && <div style={card}>Não foi possível carregar a equipe.</div>}

      {data && (
        <div style={card}>
          {data.team.map((person) => (
            <div key={person.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #edf2f7', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <strong style={{ color: '#2d3748' }}>{person.name}</strong>
                <div style={{ color: '#718096', fontSize: 13 }}>{person.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isOwner && person.role !== 'OWNER' ? (
                  <select value={person.role} onChange={(e) => handleRole(person, e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e0' }}>
                    <option value="SOCIO">Sócio</option>
                    <option value="ANALISTA">Analista</option>
                  </select>
                ) : (
                  <span style={{ background: '#edf2f7', padding: '4px 10px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{ROLE_LABELS[person.role]}</span>
                )}
                {canManage && person.role !== 'OWNER' && (person.role === 'ANALISTA' || isOwner) && (
                  <button onClick={() => handleRemove(person)} title="Remover da equipe" style={{ background: '#fff5f5', border: '1px solid #feb2b2', color: '#e53e3e', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <form onSubmit={handleAdd} style={card}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}><UserPlus size={20} /> Adicionar pessoa</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <input style={input} placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input style={input} type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input style={input} type="password" placeholder="Senha inicial (mín. 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required autoComplete="new-password" />
            <select style={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ANALISTA">Analista</option>
              {isOwner && <option value="SOCIO">Sócio</option>}
            </select>
          </div>
          <button type="submit" style={{ marginTop: 16, background: '#3182ce', color: 'white', border: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 700, cursor: 'pointer' }}>
            Adicionar à equipe
          </button>
        </form>
      )}
    </div>
  );
}
