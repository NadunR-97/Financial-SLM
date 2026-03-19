import axios from "axios";

const API = axios.create({
  baseURL: "/api", // We rely on the Vite proxy we set up in vite.config.ts
});

// Automatically add the token to every request if we have one
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;