import React from 'react';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';
import { FileSignature, FileText, LifeBuoy, CalendarClock, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const fetcher = (url) => api.get(url).then((res) => res.data);

// "O que falta resolver" do portal do cliente: documentos para assinar ou ler,
// chamados com resposta nova e tarefas em aberto. Os dados vêm só do próprio cliente.
export default function PortalPending() {
  const navigate = useNavigate();
  const { data } = useSWR('/portal/pending', fetcher);
  if (!data) return null;

  const items = [
    { icon: FileSignature, label: 'documentos para assinar', count: data.documentsToSign.length, to: '/app/documentos' },
    { icon: FileText, label: 'documentos novos para ler', count: data.unreadDocuments, to: '/app/documentos' },
    { icon: LifeBuoy, label: 'chamados com resposta nova', count: data.ticketsWithReply, to: '/app/helpdesk' },
    { icon: CalendarClock, label: 'tarefas em aberto', count: data.openTasks.length, to: '/app/agenda' },
  ].filter((item) => item.count > 0);

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#2d3748' }}>O que falta resolver</h3>
      {items.length === 0 ? (
        <p style={{ margin: 0, color: '#38a169', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <CheckCircle size={18} /> Tudo em dia por aqui.
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {items.map(({ icon: Icon, label, count, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#2d3748', fontSize: 14 }}
            >
              <Icon size={18} color="#3182ce" />
              <strong>{count}</strong> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
