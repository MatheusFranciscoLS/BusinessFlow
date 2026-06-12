import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Container, Header, LogTable, LogRow, Badge, TextCol } from './styles';

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await api.get('/audit');
        setLogs(response.data);
      } catch (error) {
        console.error("Erro ao carregar auditoria", error);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  // Formatar data para o padrão Brasileiro
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Container>
      <Header>
        <h1><ShieldCheck size={28} color="#2563eb" /> Trilha de Auditoria</h1>
        <p>Monitoramento em tempo real de todas as ações de segurança e alterações críticas no sistema.</p>
      </Header>

      <LogTable>
        <LogRow style={{ background: '#f8fafc', fontWeight: 'bold', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
          <div>Data e Hora</div>
          <div>Usuário</div>
          <div>Ação</div>
          <div>Detalhes do Evento</div>
        </LogRow>

        {loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Nenhum evento registrado ainda na caixa preta.
          </div>
        )}

        {!loading && logs.map((log) => (
          <LogRow key={log.id}>
            <TextCol>{formatDate(log.createdAt)}</TextCol>
            <TextCol>
              <strong>{log.userName}</strong>
              <span>{log.userRole}</span>
            </TextCol>
            <div>
              <Badge $action={log.action}>{log.action}</Badge>
            </div>
            <TextCol>
              <strong>Módulo: {log.module}</strong>
              {log.details}
            </TextCol>
          </LogRow>
        ))}
      </LogTable>
    </Container>
  );
}