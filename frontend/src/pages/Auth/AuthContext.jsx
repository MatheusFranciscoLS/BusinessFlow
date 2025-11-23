import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storedToken = localStorage.getItem('@BusinessFlow:token');
      const storedUser = localStorage.getItem('@BusinessFlow:user');

      if (storedToken && storedUser) {
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  // --- FUNÇÃO DE LOGIN REAL ---
  async function signIn({ email, password }) {
    try {
      // Faz a requisição para o seu Backend rodando na porta 3001
      const response = await api.post('/auth/login', { email, password });

      // O Backend retorna { token, user, ... }
      const { token, user } = response.data;

      // Salva no navegador
      localStorage.setItem('@BusinessFlow:token', token);
      localStorage.setItem('@BusinessFlow:user', JSON.stringify(user));

      // Configura o axios para as próximas chamadas
      api.defaults.headers.Authorization = `Bearer ${token}`;
      
      // Atualiza o estado da aplicação
      setUser(user);

    } catch (error) {
      console.error("Erro no login:", error);
      // Repassa o erro para a tela de Login mostrar o Toast/Alerta
      throw error;
    }
  }

  // --- FUNÇÃO DE LOGOUT ---
function signOut() {
    try {
      // 1. Limpa o armazenamento local
      localStorage.removeItem('@BusinessFlow:token');
      localStorage.removeItem('@BusinessFlow:user');
      
      // 2. Limpa o cabeçalho da API
      api.defaults.headers.Authorization = undefined;
      
      // 3. Atualiza o estado para null (Isso deveria disparar o re-render)
      setUser(null);

      // 4. FORÇA O REDIRECIONAMENTO (Garante que vai sair)
      window.location.href = '/';
      
    } catch (error) {
      console.error("Erro ao fazer logout", error);
      // Se der erro, força a saída mesmo assim
      window.location.href = '/';
    }
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}