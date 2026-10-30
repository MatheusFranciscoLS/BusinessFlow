import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import CompetenceTable, { competenceSummaryText } from '../../components/CompetenceTable';
import { Page, PageHeader, Card, SecondaryButton, Muted, MONTHS } from '../../components/ui';

const fetcher = (url) => api.get(url).then((res) => res.data);

// A competência padrão é o mês anterior: é a que o escritório entrega neste mês.
function previousMonth() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendencia', label: 'Com pendência' },
  { id: 'atraso', label: 'Com atraso' },
];

const hasStatus = (row, statuses) => Object.values(row.cells).some((cell) => statuses.includes(cell.status));

export default function Competence() {
  const { selectedCompany } = useAuth();
  const [period, setPeriod] = useState(previousMonth);
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');

  const { data, error } = useSWR(
    selectedCompany ? `/home/competence?month=${period.month}&year=${period.year}&c=${selectedCompany.id}` : null,
    fetcher,
  );

  const move = (delta) => setPeriod(({ month, year }) => {
    const d = new Date(year, month - 1 + delta, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const view = useMemo(() => {
    if (!data) return null;
    const term = search.trim().toLowerCase();
    const rows = data.rows.filter((row) => {
      if (term && !row.client.name.toLowerCase().includes(term)) return false;
      if (filter === 'atraso') return hasStatus(row, ['atrasado']);
      if (filter === 'pendencia') return hasStatus(row, ['pendente', 'atrasado', 'sem_tarefa', 'sem_cobranca']);
      return true;
    });
    return { ...data, rows };
  }, [data, filter, search]);

  const label = `${MONTHS[period.month - 1]} de ${period.year}`;

  return (
    <Page>
      <PageHeader>
        <div>
          <div className="kicker">Mapa da competência</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <SecondaryButton type="button" onClick={() => move(-1)} aria-label="Competência anterior" style={{ padding: '0 14px' }}>‹</SecondaryButton>
            <h1 style={{ margin: '0 8px' }}>{label.charAt(0).toUpperCase() + label.slice(1)}</h1>
            <SecondaryButton type="button" onClick={() => move(1)} aria-label="Próxima competência" style={{ padding: '0 14px' }}>›</SecondaryButton>
          </div>
          <p>As guias de uma competência vencem no mês seguinte. Gere as tarefas do mês em Tarefas e prazos.</p>
        </div>
      </PageHeader>

      <Card $flush>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '16px 20px 10px' }}>
          <div>
            <h2>Clientes e entregas</h2>
            {data && <Muted>{competenceSummaryText(data.summary)}</Muted>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <div role="group" aria-label="Filtrar clientes" style={{ display: 'flex', gap: 6 }}>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    minHeight: 36, padding: '0 12px', borderRadius: 999, font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${filter === f.id ? '#0f172a' : '#cbd5e1'}`,
                    background: filter === f.id ? '#0f172a' : '#ffffff',
                    color: filter === f.id ? '#ffffff' : '#0f172a',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label>
              <span style={{ position: 'absolute', left: -9999 }}>Buscar cliente</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente"
                style={{ minHeight: 36, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 12px', font: 'inherit', fontSize: 14 }}
              />
            </label>
          </div>
        </div>
        {error && <p role="alert" style={{ padding: '0 20px 16px', color: '#991b1b' }}>Não foi possível carregar o mapa. Tente de novo.</p>}
        {!data && !error && <p style={{ padding: '0 20px 16px', color: '#64748b' }}>Carregando...</p>}
        {view && view.rows.length === 0 && data.rows.length > 0 && (
          <p style={{ padding: '4px 20px 20px', margin: 0, color: '#475569' }}>Nenhum cliente com esse filtro. Tudo em dia.</p>
        )}
        {view && (view.rows.length > 0 || data.rows.length === 0) && <CompetenceTable data={view} />}
      </Card>
    </Page>
  );
}
