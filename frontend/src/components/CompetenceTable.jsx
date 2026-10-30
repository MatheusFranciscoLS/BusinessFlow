import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { StatusChip, Muted, formatDate } from './ui';

// Mapa da competência: clientes nas linhas, entregas do mês nas colunas.
// Cada célula diz a situação em texto (e símbolo), não só em cor.

const Table = styled.table`
  border-collapse: collapse;
  width: 100%;
  min-width: 760px;

  th {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    text-align: left;
    padding: 10px 10px;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
    background: #ffffff;
  }
  th small { display: block; font-weight: 400; font-size: 12px; color: #64748b; }
  td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; white-space: nowrap; }
  tbody tr:hover td { background: #f8fafc; }
  th:first-child, td:first-child { padding-left: 20px; }
  .client { font-weight: 600; color: #0f172a; white-space: normal; }
  .client small { display: block; font-weight: 400; color: #64748b; font-size: 12.5px; }
`;

function obligationCell(cell) {
  switch (cell.status) {
    case 'ok': return <StatusChip tone="ok">Concluída</StatusChip>;
    case 'pendente': return <StatusChip tone="pendente">Vence {formatDate(cell.dueDate)}</StatusChip>;
    case 'atrasado': return <StatusChip tone="atrasado">Atrasada</StatusChip>;
    case 'sem_tarefa': return <StatusChip tone="aviso">Tarefa não gerada</StatusChip>;
    default: return <Muted>não se aplica</Muted>;
  }
}

function feeCell(cell) {
  switch (cell.status) {
    case 'ok': return <StatusChip tone="ok">Pago</StatusChip>;
    case 'pendente': return <StatusChip tone="pendente">A receber</StatusChip>;
    case 'atrasado': return <StatusChip tone="atrasado">Em atraso</StatusChip>;
    case 'sem_cobranca': return <StatusChip tone="aviso">Cobrança não gerada</StatusChip>;
    default: return <Muted>sem honorário</Muted>;
  }
}

function documentsCell(cell) {
  if (!cell.count) return <Muted>nenhum</Muted>;
  return <StatusChip tone="aviso">{cell.count === 1 ? '1 documento' : `${cell.count} documentos`}</StatusChip>;
}

const RENDER = { das: obligationCell, dctfweb: obligationCell, honorario: feeCell, documentos: documentsCell };

// Quem precisa de atenção primeiro: atraso, depois o que falta gerar, depois o que está em andamento.
const PRIORITY = { atrasado: 0, sem_tarefa: 1, sem_cobranca: 1, pendente: 2 };
const rowPriority = (row) => Math.min(3, ...Object.values(row.cells).map((cell) => PRIORITY[cell.status] ?? 3));

export default function CompetenceTable({ data, limit }) {
  const sorted = [...data.rows].sort((a, b) => rowPriority(a) - rowPriority(b));
  const rows = limit ? sorted.slice(0, limit) : sorted;

  if (data.rows.length === 0) {
    return <p style={{ padding: '8px 20px 20px', margin: 0, color: '#475569' }}>Nenhum cliente ativo. Cadastre clientes em <Link to="/app/clientes">Clientes</Link> para acompanhar as entregas do mês.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table>
        <caption style={{ position: 'absolute', left: -9999 }}>Situação das entregas de cada cliente na competência</caption>
        <thead>
          <tr>
            <th scope="col">Cliente</th>
            {data.columns.map((col) => (
              <th scope="col" key={col.key}>{col.label}{col.due && <small>{col.due}</small>}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.client.id}>
              <th scope="row" className="client" style={{ borderBottom: '1px solid #f1f5f9' }}>
                {row.client.name}
                <small>{row.client.regime || 'Regime não informado'}</small>
              </th>
              {data.columns.map((col) => (
                <td key={col.key}>{RENDER[col.key](row.cells[col.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

// "41 de 64 entregas feitas, 20 pendentes, 3 atrasadas"
export function competenceSummaryText(summary) {
  const total = summary.ok + summary.pendente + summary.atrasado + summary.sem_tarefa + summary.sem_cobranca;
  const parts = [`${summary.ok} de ${total} entregas feitas`];
  if (summary.pendente) parts.push(`${summary.pendente} em andamento`);
  if (summary.atrasado) parts.push(`${summary.atrasado} atrasadas`);
  const missing = summary.sem_tarefa + summary.sem_cobranca;
  if (missing) parts.push(`${missing} sem tarefa ou cobrança gerada`);
  return parts.join(', ');
}
