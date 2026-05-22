import axios from "axios";

const api = axios.create({
  // URL dinâmica: usa a variável de ambiente em produção ou localhost no seu computador
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
});

// 1. Injeta o token em TODAS as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@BusinessFlow:token"); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Tenta fazer o Refresh Token silencioso se a sessão expirar
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("@BusinessFlow:refreshToken");
      
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        const { data } = await api.post("/auth/refresh-token", { refreshToken });
        localStorage.setItem("@BusinessFlow:token", data.token);
        error.config.headers.Authorization = `Bearer ${data.token}`;
        return api(error.config);
      } catch (err) {
        localStorage.clear();
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;