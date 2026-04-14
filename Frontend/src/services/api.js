import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally - clear auth and reload
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

export const analyzeEntry = async (text) => {
  const res = await api.post("/entries/analyze", { text });
  return res.data;
};

export const saveEntry = async (entryData) => {
  const res = await api.post("/entries/save", entryData);
  return res.data;
};

export const getEntries = async () => {
  const res = await api.get("/entries");
  return res.data;
};

export const getLifeCard = async () => {
  const res = await api.get("/entries/life-card");
  return res.data;
};

export const getLeaderboard = async () => {
  const res = await api.get("/leaderboard");
  return res.data;
};

export const register = async (name, email, password) => {
  const res = await api.post("/auth/register", { name, email, password });
  return res.data;
};

export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};
