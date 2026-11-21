import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL;
const defaultApiUrl = import.meta.env.PROD ? "/api" : "http://localhost:5000/api";

export const api = axios.create({
  baseURL: import.meta.env.PROD
    ? (configuredApiUrl?.startsWith("/") ? configuredApiUrl : defaultApiUrl)
    : (configuredApiUrl || defaultApiUrl),
  timeout: 15000,
  withCredentials: true
});
