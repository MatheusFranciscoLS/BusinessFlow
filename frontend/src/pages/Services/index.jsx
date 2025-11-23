import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Package } from 'lucide-react';
import { 
  Container, Header, Toolbar, SearchContainer, NewButton, GridContainer, 
  ServiceCard, ImageContainer, CardContent, CardFooter, Actions, ActionButton,
  ModalOverlay, ModalContent, FormGroup, ModalActions 
} from './styles';

export default function Services() {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form Data
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);

  async function loadServices() {
    try {
      const response = await api.get('/products');
      setServices(response.data);
    } catch (error) {
      console.log("Erro ao carregar serviços");
    }
  }

  useEffect(() => { loadServices(); }, []);

  // Filtro de Busca
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function formatPrice(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function handleOpenNew() {
    setEditingId(null);
    setName(''); setCategory(''); setPrice(''); setImage(null);
    setIsModalOpen(true);
  }

  function handleEdit(service) {
    setEditingId(service.id);
    setName(service.name);
    setCategory(service.category || '');
    setPrice(service.price);
    setImage(null); 
    setIsModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm("Excluir este item?")) {
      try {
        await api.delete(`/products/${id}`);
        setServices(services.filter(s => s.id !== id));
        toast.success("Item removido.");
      } catch { toast.error("Erro ao excluir."); }
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('stock', 100); 
    if (image) formData.append('images', image);

    const loadingToast = toast.loading('Salvando...');

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
        toast.success("Atualizado com sucesso!", { id: loadingToast });
      } else {
        await api.post('/products', formData);
        toast.success("Criado com sucesso!", { id: loadingToast });
      }
      
      setIsModalOpen(false);
      loadServices();
    } catch (error) {
      toast.error("Erro ao salvar.", { id: loadingToast });
    }
  }

  return (
    <Container>
      <Header>
        <h1>Meus Serviços / Produtos</h1>
        <Toolbar>
          <SearchContainer>
            <Search size={20} color="#a0aec0" />
            <input 
              placeholder="Buscar produto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          <NewButton onClick={handleOpenNew}>
            <Plus size={20} /> Novo Item
          </NewButton>
        </Toolbar>
      </Header>

      <GridContainer>
        {filteredServices.map(service => (
          <ServiceCard key={service.id}>
            {/* Área da Imagem */}
            <ImageContainer>
              {service.images && service.images.length > 0 ? (
                <img src={service.images[0].url} alt={service.name} />
              ) : (
                <Package size={64} strokeWidth={1} />
              )}
            </ImageContainer>

            {/* Conteúdo */}
            <CardContent>
              <span className="category">{service.category || 'Geral'}</span>
              <h3 title={service.name}>{service.name}</h3>

              <CardFooter>
                <span className="price">{formatPrice(service.price)}</span>
                <Actions>
                  <ActionButton 
                    onClick={() => handleEdit(service)} 
                    color="#718096" 
                    $bgHover="#ebf8ff"
                    $hoverColor="#3182ce"
                  >
                    <Edit size={18} />
                  </ActionButton>
                  <ActionButton 
                    onClick={() => handleDelete(service.id)} 
                    color="#718096" 
                    $bgHover="#fff5f5"
                    $hoverColor="#e53e3e"
                  >
                    <Trash2 size={18} />
                  </ActionButton>
                </Actions>
              </CardFooter>
            </CardContent>
          </ServiceCard>
        ))}
      </GridContainer>

      {/* MODAL */}
      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>{editingId ? 'Editar' : 'Novo'} Item</h2>
            <form onSubmit={handleSave}>
              <FormGroup>
                <label>Nome</label>
                <input value={name} onChange={e => setName(e.target.value)} required />
              </FormGroup>
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
                <FormGroup>
                  <label>Preço (R$)</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                </FormGroup>
              </div>
              <FormGroup>
                <label>Imagem (Opcional)</label>
                <div style={{ border: '1px dashed #cbd5e0', padding: 20, borderRadius: 6, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                  <input 
                    type="file" 
                    onChange={e => setImage(e.target.files[0])} 
                    style={{ opacity: 0, position: 'absolute', top:0, left:0, width:'100%', height:'100%', cursor:'pointer' }}
                  />
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color: '#718096' }}>
                    <ImageIcon size={24} />
                    <span style={{ fontSize: 12, marginTop: 8 }}>
                      {image ? image.name : "Clique para upload"}
                    </span>
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