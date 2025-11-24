import React, { createContext, useState, useEffect, useContext } from 'react';
import api from "../../api/api.jsx";
 // <--- O erro "api is not defined" era falta dessa linha

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // <--- O erro "setUser is not defined" era falta dessa linha
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storedToken = localStorage.getItem('@BusinessFlow:token');
      const storedUser = localStorage.getItem('@BusinessFlow:user');

      if (storedToken && storedUser) {
        // Configura o token para as requisições
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

      // Verificação de segurança antes de salvar
      if (response.data && response.data.token) {
        const { token, user } = response.data;

        localStorage.setItem('@BusinessFlow:token', token);
        localStorage.setItem('@BusinessFlow:user', JSON.stringify(user));

        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(user);
      } else {
        // Se o backend não mandou token, não salva nada e joga erro
        throw new Error("Token não recebido do servidor");
      }

    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  }

  function signOut() {
    localStorage.removeItem('@BusinessFlow:token');
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
  const context = useContext(AuthContext);
  return context;
}