import axios from "axios";

const api = axios.create({
  baseURL: "https://businessflow.onrender.com/api",
});

// Adiciona token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tenta refresh token se expirar
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return Promise.reject(error);

      try {
        const { data } = await api.post("/auth/refresh-token", { refreshToken });

        localStorage.setItem("accessToken", data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;

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
