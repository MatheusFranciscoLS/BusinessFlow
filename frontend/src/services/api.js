import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
});

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
    if (
      error.response?.status === 401 &&
      error.config &&
      !error.config._retry
    ) {
      error.config._retry = true;
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
