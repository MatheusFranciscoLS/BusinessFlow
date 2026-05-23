import axios from "axios";

const api = axios.create({
  // Já configurado para o seu backend no Render
  baseURL: "https://businessflow-api.onrender.com",
});

api.interceptors.request.use((config) => {
  // CORREÇÃO: Buscando a chave exata que o AuthContext salva
  const token = localStorage.getItem("@BusinessFlow:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
        const { data } = await api.post("/auth/refresh-token", {
          refreshToken,
        });
        localStorage.setItem("@BusinessFlow:token", data.token);
        error.config.headers.Authorization = `Bearer ${data.token}`;
        return api(error.config);
      } catch (err) {
        localStorage.clear();
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
