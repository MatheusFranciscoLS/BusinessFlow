import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast'; // 🔥 1. Adicionámos o toast para o aviso visual

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // 🔥 2. Subimos o signOut para o topo para que o Intercetor possa usá-lo
  function signOut() {
    localStorage.removeItem('@BusinessFlow:token');
    localStorage.removeItem('@BusinessFlow:refreshToken');
    localStorage.removeItem('@BusinessFlow:user');
    localStorage.removeItem('@BusinessFlow:companyId'); 
    api.defaults.headers.Authorization = undefined;
    api.defaults.headers['x-company-id'] = undefined;
    setUser(null);
    setCompanies([]);
    setSelectedCompany(null);
    window.location.href = '/';
  }

  useEffect(() => {
    async function loadStorageData() {
      const storedToken = localStorage.getItem('@BusinessFlow:token');
      const storedUser = localStorage.getItem('@BusinessFlow:user');
      const storedCompanyId = localStorage.getItem('@BusinessFlow:companyId');

      if (storedToken && storedUser) {
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Se for o Gestor, carrega as empresas
        if (parsedUser.role !== 'CLIENT') {
          try {
            const compRes = await api.get('/companies');
            setCompanies(compRes.data);
            
            if (compRes.data.length > 0) {
              const companyToSelect = compRes.data.find(c => c.id === storedCompanyId) || compRes.data[0];
              setSelectedCompany(companyToSelect);
              api.defaults.headers['x-company-id'] = companyToSelect.id;
              localStorage.setItem('@BusinessFlow:companyId', companyToSelect.id);
            }
          } catch (error) {
            console.error("Erro ao carregar empresas", error);
          }
        }
      }
      setLoading(false);
    }

    loadStorageData();

    // 🔥 3. A MÁGICA DA UX: O Intercetor inserido com segurança na sua arquitetura
    const interceptor = api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          toast.error("A sua sessão expirou por segurança. Faça login novamente.", { duration: 5000 });
          signOut(); // Expulsa o "fantasma" automaticamente!
        }
        return Promise.reject(error);
      }
    );

    // Limpa o intercetor quando o componente for desmontado
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  async function signIn({ email, password }) {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { token, refreshToken, user } = response.data;

      localStorage.setItem('@BusinessFlow:token', token);
      if (refreshToken) localStorage.setItem('@BusinessFlow:refreshToken', refreshToken);
      localStorage.setItem('@BusinessFlow:user', JSON.stringify(user));

      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(user);

      // Redirecionamento suave
      window.location.href = '/#/app';
      
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  }

  function changeCompany(companyId) {
    const comp = companies.find(c => c.id === companyId);
    if (comp) {
      setSelectedCompany(comp);
      api.defaults.headers['x-company-id'] = comp.id;
      localStorage.setItem('@BusinessFlow:companyId', comp.id);
      window.location.reload(); 
    }
  }

  function updateUserData(newData) {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('@BusinessFlow:user', JSON.stringify(updatedUser));
  }

  return (
    <AuthContext.Provider value={{ 
      signed: !!user, user, loading, signIn, signOut, 
      companies, selectedCompany, changeCompany, updateUserData 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);