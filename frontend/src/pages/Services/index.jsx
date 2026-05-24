import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Package, Ghost } from 'lucide-react';
import { 
  Container, Header, Toolbar, SearchContainer, ButtonGroup, GridContainer, 
  ServiceCard, ImageContainer, CardContent, CardFooter, Actions, ActionButton,
  ModalOverlay, ModalContent, FormGroup, ModalActions, EmptyState 
} from './styles';
import styled, { keyframes } from 'styled-components';

// 🔥 Animação Shimmer em Cartões
const shimmer = keyframes`0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; }`;
const SkeletonCard = styled.div`
  height: 280px; width: 100%; border-radius: 16px; border: 1px solid #edf2f7;
  background: #f0f0f0; background-image: linear-gradient(90deg, #f0f0f0 0px, #fafafa 150px, #f0f0f0 300px);
  background-size: 1000px 100%; animation: ${shimmer} 2s infinite linear;
`;

const fetcher = (url) => api.get(url).then(res => res.data);

export default function Services() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // 🔥 SWR: Otimização de Performance
  const { data: services, error, mutate } = useSWR('/products', fetcher);

  // Form Data
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  function formatPrice(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function handleOpenNew() {
    setEditingId(null); setName(''); setCategory(''); setPrice(''); setImage(null);
    setIsModalOpen(true);
  }

  function handleEdit(service) {
    setEditingId(service.id); setName(service.name); setCategory(service.category || ''); setPrice(service.price); setImage(null); 
    setIsModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm("Excluir este item?")) {
      try {
        await api.delete(`/products/${id}`);
        mutate(); // 🔥 Recarrega instantaneamente na interface
        toast.success("Item removido.");
      } catch { toast.error("Erro ao excluir o serviço."); }
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name); formData.append('category', category); formData.append('price', price); formData.append('stock', 100); 
    if (image) formData.append('images', image);

    const loadingToast = toast.loading('Salvando...');
    try {
      if (editingId) await api.put(`/products/${editingId}`, formData);
      else await api.post('/products', formData);
      
      setIsModalOpen(false);
      mutate(); // 🔥 Puxa o produto novo na hora!
      toast.success("Salvo com sucesso!", { id: loadingToast });
    } catch (err) { toast.error("Erro ao salvar.", { id: loadingToast }); }
  }

  if (error) return <div style={{ padding: 40, color: 'red' }}>Erro ao carregar serviços.</div>;

  return (
    <Container>
      <Header>
        <h1>Meus Serviços / Produtos</h1>
        <Toolbar>
          <SearchContainer>
            <Search size={20} color="#a0aec0" />
            <input placeholder="Buscar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!services} />
          </SearchContainer>
          <ButtonGroup>
            <button className="primary" onClick={handleOpenNew} disabled={!services}><Plus size={20} /> Novo Item</button>
          </ButtonGroup>
        </Toolbar>
      </Header>

      {/* 🔥 ESTADO DE CARREGAMENTO (SKELETONS) */}
      {!services ? (
        <GridContainer>
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </GridContainer>
      ) : services.length === 0 ? (
        <EmptyState><Ghost size={48} /><p>Nenhum serviço ou produto cadastrado.</p><small>Clique no botão "Novo Item" para começar.</small></EmptyState>
      ) : filteredServices.length === 0 ? (
        <EmptyState><Search size={48} /><p>Nenhum resultado para "{searchTerm}"</p><small>Tente buscar por outro termo.</small></EmptyState>
      ) : (
        <GridContainer>
          {filteredServices.map(service => (
            <ServiceCard key={service.id}>
              <ImageContainer>
                {service.images && service.images.length > 0 ? (
                  <img src={service.images[0].url} alt={service.name} />
                ) : (
                  <Package size={64} strokeWidth={1} color="#a0aec0" />
                )}
              </ImageContainer>

              <CardContent>
                <span className="category">{service.category || 'Geral'}</span>
                <h3 title={service.name}>{service.name}</h3>

                <CardFooter>
                  <span className="price">{formatPrice(service.price)}</span>
                  <Actions>
                    <ActionButton onClick={() => handleEdit(service)} color="#718096" $bgHover="#ebf8ff" $hoverColor="#3182ce" title="Editar"><Edit size={18} /></ActionButton>
                    <ActionButton onClick={() => handleDelete(service.id)} color="#718096" $bgHover="#fff5f5" $hoverColor="#e53e3e" title="Excluir"><Trash2 size={18} /></ActionButton>
                  </Actions>
                </CardFooter>
              </CardContent>
            </ServiceCard>
          ))}
        </GridContainer>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>{editingId ? 'Editar' : 'Novo'} Item</h2>
            <form onSubmit={handleSave}>
              <FormGroup><label>Nome</label><input value={name} onChange={e => setName(e.target.value)} required /></FormGroup>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup>
                  <label>Categoria</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} required>
                    <option value="">Selecione...</option>
                    <option value="Desenvolvimento">Desenvolvimento</option>
                    <option value="Suporte">Suporte / Manutenção</option>
                    <option value="Infraestrutura">Infraestrutura / Redes</option>
                    <option value="Assinatura">Assinatura / SaaS</option>
                    <option value="Consultoria">Consultoria</option>
                  </select>
                </FormGroup>
                <FormGroup><label>Preço (R$)</label><input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required /></FormGroup>
              </div>
              <FormGroup>
                <label>Imagem (Opcional)</label>
                <div style={{ border: '1px dashed #cbd5e0', padding: 20, borderRadius: 6, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                  <input type="file" onChange={e => setImage(e.target.files[0])} style={{ opacity: 0, position: 'absolute', top:0, left:0, width:'100%', height:'100%', cursor:'pointer' }} />
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color: '#718096' }}>
                    <ImageIcon size={24} />
                    <span style={{ fontSize: 12, marginTop: 8 }}>{image ? image.name : "Clique para upload"}</span>
                  </div>
                </div>
              </FormGroup>
              <ModalActions>
                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="save">Salvar</button>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}