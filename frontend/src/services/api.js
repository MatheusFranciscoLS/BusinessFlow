import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
});

// Variáveis para a Fila de Espera do Refresh Token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@BusinessFlow:token");
  const companyId = localStorage.getItem("@BusinessFlow:companyId");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (companyId) config.headers["x-company-id"] = companyId;

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Se já está a atualizar o token, coloca esta requisição na fila de espera
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

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
        originalRequest.headers.Authorization = `Bearer ${data.token}`;

        // Processa todas as requisições que estavam paradas na fila
        processQueue(null, data.token);

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// Função para assinar o documento eletronicamente
export async function signDocument(documentId) {
  const response = await api.put(`/documents/${documentId}/sign`);
  return response.data;
}

export default api;
