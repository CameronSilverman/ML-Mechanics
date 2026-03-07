const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const request = async (path, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

export const authAPI = {
  register: (email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

export const projectsAPI = {
  list: (token) =>
    request("/projects", {}, token),

  get: (id, token) =>
    request(`/projects/${id}`, {}, token),

  create: (name, data, token) =>
    request("/projects", {
      method: "POST",
      body: JSON.stringify({ name, data }),
    }, token),

  update: (id, name, data, token) =>
    request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, data }),
    }, token),

  delete: (id, token) =>
    request(`/projects/${id}`, { method: "DELETE" }, token),
};