import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Also attach bearer token from localStorage as a fallback to the httpOnly cookie
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dermaai_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("dermaai_token");
    }
    return Promise.reject(err);
  }
);

export default api;
