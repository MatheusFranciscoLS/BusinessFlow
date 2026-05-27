import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UploadCloud, FileText, Clock, CheckCircle, 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Building2
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';

// --- ESTILOS ---
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const Container = styled.div`width: 100%; padding-bottom: 40px; animation: ${fadeIn} 0.4s ease;`;
const WelcomeBox = styled.div`background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); padding: 32px; border-radius: 16px; color: white; margin-bottom: 32px; box-shadow: 0 10px 25px rgba(49, 130, 206, 0.2); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;`;
const CardsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 32px;`;
const StatCard = styled.div`background: white; border-radius: 12px; padding: 24px; border: 1px solid #edf2f7; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); .title { display: flex; align-items: center; justify-content: space-between; color: #718096; font-size: 14px; font-weight: 600; } .value { font-size: 28px; font-weight: 800; color: ${props => props.$color || '#2d3748'}; }`;

const ActionGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;`;
const ActionCard = styled.button`background: white; border: 1px dashed #cbd5e0; border-radius: 12px; padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: 0.2s; color: #4a5568; &:hover { border-color: #3182ce; background: #ebf8ff; color: #3182ce; transform: translateY(-2px); } strong { font-size: 16px; } span { font-size: 13px; text-align: center; }`;

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(2px);`;
const ModalContent = styled.div`background: white; padding: 32px; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; label { font-size: 14px; font-weight: 600; color: #4a5568; } input, select, textarea { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; &:focus { border-color: #3182ce; } }`;
const ModalActions = styled.div`display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; button { padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; border: none; } .cancel { background: #edf2f7; color: #4a5568; &:hover { background: #e2e8f0; } } .save { background: #3182ce; color: white; &:hover { background: #2c5282; } }`;

const fetcher = (url) => api.get(url).then((res) => res.data);

export default function Dashboard() {
  const { user, selectedCompany } = useAuth();
  
  // Puxar transações do mês atual para os cards de resumo
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: transactions, mutate } = useSWR(`/transactions?month=${currentMonth}&year=${currentYear}`, fetcher);

  // Estados do Modal do Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', date: '', file: null });

  const isClient = user?.role === 'CLIENT';

  // Cálculos rápidos para o Resumo
  const summary = useMemo(() => {
    if (!transactions) return { entradas: 0, saidas: 0, pendentes: 0 };
    return transactions.reduce((acc, t) => {
      const val = t.amount || t.price || 0;
      if (t.status === 'PAGO') {
        if (t.type === 'entrada' || t.type === 'income') acc.entradas += val;
        else acc.saidas += val;
      } else {
        if (t.type === 'saida' || t.type === 'outcome') acc.pendentes += 1;
      }
      return acc;
    }, { entradas: 0, saidas: 0, pendentes: 0 });
  }, [transactions]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // 🔥 FUNÇÃO DO CLIENTE: Enviar um documento/conta
  async function handleSendDocument(e) {
    e.preventDefault();
    if (!form.file) return toast.error("Por favor, anexe o PDF ou a imagem da nota/conta.");
    
    const tId = toast.loading("A enviar documento para o seu contador...");
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', 'Enviado pelo Portal do Cliente');
      formData.append('amount', form.amount);
      formData.append('type', 'saida'); // Forçamos como uma "Despesa" a pagar
      formData.append('category', 'A Classificar'); // 🔥 O contador organiza depois!
      formData.append('date', new Date(form.date).toISOString());
      formData.append('status', 'PENDENTE');
      formData.append('file', form.file);

      await api.post('/transactions', formData);
      toast.success("Documento enviado com sucesso!", { id: tId });
      setIsModalOpen(false);
      setForm({ title: '', amount: '', date: '', file: null });
      mutate(); // Atualiza a contagem no ecrã
    } catch (error) {
      toast.error("Erro ao enviar o documento.", { id: tId });
    }
  }

  // =======================================================================
  // 👔 VISÃO DO ADMINISTRADOR (ESCRITÓRIO)
  // =======================================================================
  if (!isClient) {
    return (
      <Container>
        <WelcomeBox>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Painel do Escritório</h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>Visão geral do negócio: <strong>{selectedCompany?.name || 'Nenhuma empresa selecionada'}</strong></p>
          </div>
          <Building2 size={60} opacity={0.2} />
        </WelcomeBox>

        {!selectedCompany ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#a0aec0', background: 'white', borderRadius: 12, border: '1px solid #edf2f7' }}>
            <h2>Selecione uma Empresa</h2>
            <p>Utilize o menu lateral para escolher um cliente e aceder aos seus dados.</p>
          </div>
        ) : (
          <>
            <CardsGrid>
              <StatCard>
                <div className="title">Entradas do Mês <ArrowUpCircle size={18} color="#12a454" /></div>
                <div className="value" style={{ color: '#12a454' }}>{formatCurrency(summary.entradas)}</div>
              </StatCard>
              <StatCard>
                <div className="title">Saídas do Mês <ArrowDownCircle size={18} color="#e52e4d" /></div>
                <div className="value" style={{ color: '#e52e4d' }}>{formatCurrency(summary.saidas)}</div>
              </StatCard>
              <StatCard>
                <div className="title">Contas Pendentes / Atrasadas <Clock size={18} color="#d69e2e" /></div>
                <div className="value" style={{ color: '#d69e2e' }}>{summary.pendentes} avisos</div>
              </StatCard>
            </CardsGrid>
            <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #edf2f7' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#2d3748' }}>Dica do Sistema</h3>
              <p style={{ color: '#718096', lineHeight: 1.6 }}>Verifique a aba <strong>Financeiro</strong> para aprovar as Notas Fiscais enviadas pelos seus clientes. Elas aparecerão com a etiqueta amarela de <strong>PENDENTE</strong> e categoria <strong>A Classificar</strong>.</p>
            </div>
          </>
        )}
      </Container>
    );
  }

  // =======================================================================
  // 🧑‍💼 VISÃO DO CLIENTE (PORTAL SELF-SERVICE)
  // =======================================================================
  return (
    <Container>
      <WelcomeBox style={{ background: 'linear-gradient(135deg, #805ad5 0%, #553c9a 100%)' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Portal do Cliente</h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>Bem-vindo de volta, <strong>{user?.name}</strong>. Aqui você acompanha a sua empresa e envia os seus documentos de forma segura.</p>
        </div>
        <FileText size={60} opacity={0.2} />
      </WelcomeBox>

      <CardsGrid>
        <StatCard>
          <div className="title">Receitas Computadas <CheckCircle size={18} color="#12a454" /></div>
          <div className="value" style={{ color: '#12a454' }}>{formatCurrency(summary.entradas)}</div>
        </StatCard>
        <StatCard>
          <div className="title">Despesas Pagas <DollarSign size={18} color="#e52e4d" /></div>
          <div className="value" style={{ color: '#e52e4d' }}>{formatCurrency(summary.saidas)}</div>
        </StatCard>
        <StatCard>
          <div className="title">Contas Aguardando o Contador <Clock size={18} color="#d69e2e" /></div>
          <div className="value" style={{ color: '#d69e2e' }}>{summary.pendentes} documentos</div>
        </StatCard>
      </CardsGrid>

      <h3 style={{ color: '#2d3748', marginBottom: 16 }}>Ações Rápidas</h3>
      <ActionGrid>
        <ActionCard onClick={() => setIsModalOpen(true)}>
          <UploadCloud size={40} color="#3182ce" />
          <strong>Enviar Conta para Pagamento</strong>
          <span>Anexe aqui um boleto ou Nota Fiscal. O nosso escritório irá processar e agendar o pagamento por si.</span>
        </ActionCard>
      </ActionGrid>

      {/* MODAL DE ENVIO DO CLIENTE */}
      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2 style={{ marginBottom: 20 }}>Enviar Documento</h2>
            <form onSubmit={handleSendDocument}>
              <FormGroup>
                <label>Do que se trata esta conta?</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Ex: Fatura Internet VODAFONE" />
              </FormGroup>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                </FormGroup>
                <FormGroup>
                  <label>Data de Vencimento</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </FormGroup>
              </div>

              <FormGroup style={{ marginTop: 8 }}>
                <label>Anexar o PDF ou Foto (Obrigatório)</label>
                <div style={{ border: '2px dashed #cbd5e0', padding: '24px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', position: 'relative', background: '#f7fafc' }}>
                  <input type="file" onChange={e => setForm({...form, file: e.target.files[0]})} accept="image/*,application/pdf" style={{ opacity: 0, position: 'absolute', top:0, left:0, width:'100%', height:'100%', cursor:'pointer' }} required />
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color: '#4a5568' }}>
                    <UploadCloud size={28} style={{ marginBottom: 8, color: '#3182ce' }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{form.file ? form.file.name : "Clique para anexar o seu arquivo aqui"}</span>
                  </div>
                </div>
              </FormGroup>

              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Enviar ao Contador</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}