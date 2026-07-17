import { apiClient } from "./client";

export const authApi = {
  register: (payload) => apiClient.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => apiClient.post("/auth/login", payload).then((r) => r.data),
  logout: () => apiClient.post("/auth/logout", payload).then((r) => r.data),
  me: () => apiClient.post("/auth/me", payload).then((r) => r.data),
  updateProfile: (payload) => apiClient.post("/auth/profile", payload).then((r) => r.data),
  changePassword: (payload) => apiClient.post("/auth/password", payload).then((r) => r.data),
}