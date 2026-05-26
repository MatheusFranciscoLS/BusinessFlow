import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  // 🔥 ESTADOS MULTI-TENANT (Múltiplas Empresas)
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    async function loadStorageData() {
      const storedToken = localStorage.getItem('@BusinessFlow:token');
      const storedUser = localStorage.getItem('@BusinessFlow:user');
      const storedCompanyId = localStorage.getItem('@BusinessFlow:companyId'); // Lembra a última empresa acedida

      if (storedToken && storedUser) {
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
        
        // 🚀 Busca as empresas deste contabilista
        try {
          const compRes = await api.get('/companies');
          setCompanies(compRes.data);
          
          if (compRes.data.length > 0) {
            // Se ele já tinha uma empresa selecionada antes, mantém. Senão, pega a primeira.
            const companyToSelect = compRes.data.find(c => c.id === storedCompanyId) || compRes.data[0];
            setSelectedCompany(companyToSelect);
            api.defaults.headers['x-company-id'] = companyToSelect.id; // 🔥 Cola o crachá!
          }
        } catch (err) {
          console.error("Erro ao buscar empresas:", err);
        }
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  async function signIn({ email, password }) {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data && response.data.token) {
        const { token, refreshToken, user } = response.data;

        localStorage.setItem('@BusinessFlow:token', token);
        localStorage.setItem('@BusinessFlow:refreshToken', refreshToken); 
        localStorage.setItem('@BusinessFlow:user', JSON.stringify(user));

        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(user);

        // 🚀 Logo no login, já puxa as empresas e cola o crachá
        const compRes = await api.get('/companies');
        setCompanies(compRes.data);
        
        if (compRes.data.length > 0) {
          setSelectedCompany(compRes.data[0]);
          api.defaults.headers['x-company-id'] = compRes.data[0].id;
          localStorage.setItem('@BusinessFlow:companyId', compRes.data[0].id);
        }
      } else {
        throw new Error("Token não recebido do servidor");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  }

  // 🔥 FUNÇÃO PARA TROCAR DE EMPRESA NA BARRA LATERAL
  function changeCompany(companyId) {
    const comp = companies.find(c => c.id === companyId);
    if (comp) {
      setSelectedCompany(comp);
      api.defaults.headers['x-company-id'] = comp.id;
      localStorage.setItem('@BusinessFlow:companyId', comp.id);
      
      // Um truque de nível Sênior: Recarregar a página garante que todo o cache do SWR seja limpo
      // e os dados da nova empresa sejam puxados sem misturar com a antiga.
      window.location.reload(); 
    }
  }

  function signOut() {
    localStorage.removeItem('@BusinessFlow:token');
    localStorage.removeItem('@BusinessFlow:refreshToken');
    localStorage.removeItem('@BusinessFlow:user');
    localStorage.removeItem('@BusinessFlow:companyId'); // Limpa a empresa
    api.defaults.headers.Authorization = undefined;
    api.defaults.headers['x-company-id'] = undefined;
    setUser(null);
    setCompanies([]);
    setSelectedCompany(null);
  }

  return (
    <AuthContext.Provider value={{ 
      signed: !!user, user, loading, signIn, signOut, 
      companies, selectedCompany, changeCompany // 🔥 Expõe as funções para a Sidebar
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}