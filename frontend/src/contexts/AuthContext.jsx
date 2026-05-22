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

  async function signIn({ email, password }) {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data && response.data.token) {
        // Agora nós pegamos o refreshToken que o Back-end envia
        const { token, refreshToken, user } = response.data;

        localStorage.setItem('@BusinessFlow:token', token);
        localStorage.setItem('@BusinessFlow:refreshToken', refreshToken); // Salva o Refresh
        localStorage.setItem('@BusinessFlow:user', JSON.stringify(user));

        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(user);
      } else {
        throw new Error("Token não recebido do servidor");
      }

    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  }

  function signOut() {
    // Limpa absolutamente tudo para não deixar rastros
    localStorage.removeItem('@BusinessFlow:token');
    localStorage.removeItem('@BusinessFlow:refreshToken');
    localStorage.removeItem('@BusinessFlow:user');
    api.defaults.headers.Authorization = undefined;
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}