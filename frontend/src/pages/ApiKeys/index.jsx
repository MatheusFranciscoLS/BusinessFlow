import React, { useState } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Key, Plus, Copy, Trash2, ShieldCheck } from 'lucide-react';

const fetcher = (url) => api.get(url).then(res => res.data);

export default function ApiKeys() {
    const { data: keys, mutate } = useSWR('/apikeys', fetcher);
    const [newKeyName, setNewKeyName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    async function handleCreateKey(e) {
        e.preventDefault();
        if (!newKeyName) return toast.error("Dê um nome à integração.");

        setIsGenerating(true);
        const tId = toast.loading("A gerar chave de alta segurança...");

        try {
            await api.post('/apikeys', { name: newKeyName });
            toast.success("Chave gerada com sucesso!", { id: tId });
            setNewKeyName('');
            mutate();
        } catch (error) {
            toast.error("Erro ao gerar chave.", { id: tId });
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleRevoke(id) {
        if (!window.confirm("Atenção: Sistemas a usar esta chave perderão o acesso imediatamente. Confirmar?")) return;

        try {
            await api.delete(`/apikeys/${id}`);
            toast.success("Chave revogada e destruída.");
            mutate();
        } catch (error) {
            toast.error("Erro ao revogar chave.");
        }
    }

    function handleCopy(keyString) {
        navigator.clipboard.writeText(keyString);
        toast.success("Chave copiada para a área de transferência!");
    }

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Key color="#3182ce" size={32} />
                <h1 style={{ fontSize: '26px', color: '#2d3748', margin: 0 }}>Chaves de API</h1>
            </header>

            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                <h3 style={{ marginTop: 0, color: '#4a5568' }}>Nova Integração</h3>
                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
                    Gere chaves secretas para conectar o BusinessFlow ao Zapier, Make, ou outros ERPs.
                </p>

                <form onSubmit={handleCreateKey} style={{ display: 'flex', gap: '12px' }}>
                    <input
                        placeholder="Ex: Integração com Zapier"
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', outline: 'none' }}
                    />
                    <button
                        type="submit"
                        disabled={isGenerating}
                        style={{ background: '#3182ce', color: 'white', border: 'none', padding: '0 24px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <Plus size={18} /> {isGenerating ? 'A gerar...' : 'Gerar Chave'}
                    </button>
                </form>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
                {!keys ? <p>A carregar chaves...</p> : keys.length === 0 ? <p style={{ color: '#a0aec0' }}>Nenhuma chave ativa.</p> : (
                    keys.map(k => (
                        <div key={k.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShieldCheck size={16} color="#38a169" /> {k.name}
                                </h4>
                                <div style={{ background: '#f7fafc', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px', color: '#4a5568', border: '1px solid #e2e8f0', letterSpacing: '1px' }}>
                                    {k.key}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleCopy(k.key)} style={{ background: '#ebf8ff', color: '#3182ce', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }} title="Copiar Chave">
                                    <Copy size={18} />
                                </button>
                                <button onClick={() => handleRevoke(k.id)} style={{ background: '#fff5f5', color: '#e53e3e', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }} title="Revogar Acesso">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}