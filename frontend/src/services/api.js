import axios from "axios";

const api = axios.create({
  // Se existir a variável de ambiente, usa ela. Senão, usa localhost.
  // Depois no Render/Vercel é só adicionar a variável REACT_APP_API_URL
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
});

// 1. Injeta o token em TODAS as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@BusinessFlow:token"); // Chave padronizada
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Tenta fazer o Refresh Token silencioso se a sessão expirar
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Se o erro for 401 (Não Autorizado/Token Expirado)
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("@BusinessFlow:refreshToken");
      
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        // Pede um token novo pro Back-end
        const { data } = await api.post("/auth/refresh-token", { refreshToken });

        // Salva o token novo no storage
        localStorage.setItem("@BusinessFlow:token", data.token);
        
        // Atualiza a requisição original que tinha falhado e tenta de novo
        error.config.headers.Authorization = `Bearer ${data.token}`;
        return api(error.config);
      } catch (err) {
        // Se o refresh falhar (expirou o de 7 dias também), expulsa o usuário
        localStorage.clear();
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;