// client/src/services/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // backend URL
});

// Analyze one text entry
export const analyzeEntry = async (text) => {
  const res = await api.post("/analyze", { text });
  return res.data; // { mood, score }
};

// Generate life card from list of entries
export const generateLifeCard = async (entries) => {
  const res = await api.post("/life_card", entries);
  return res.data; // { title, summary }
};
