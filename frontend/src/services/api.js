import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// 1. Interceptor de ENVIO
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@BusinessFlow:token');
  
  // VERIFICAÇÃO DE SEGURANÇA ADICIONAL
  // Só envia o header se o token existir E não for a palavra "undefined" ou "null"
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// 2. Interceptor de RESPOSTA
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/') {
        // Limpa o lixo
        localStorage.removeItem('@BusinessFlow:token');
        localStorage.removeItem('@BusinessFlow:user');
        // Redireciona
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;