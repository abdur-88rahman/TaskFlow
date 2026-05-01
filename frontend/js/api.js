const API = {
  async request(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Request failed');
    return data;
  },
  // Auth
  signup: (body) => API.request('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => API.request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => API.request('/api/auth/logout', { method: 'POST' }),
  me: () => API.request('/api/auth/me'),
  // Dashboard
  dashboard: () => API.request('/api/dashboard'),
  // Projects
  getProjects: () => API.request('/api/projects'),
  createProject: (body) => API.request('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
  getProject: (id) => API.request(`/api/projects/${id}`),
  deleteProject: (id) => API.request(`/api/projects/${id}`, { method: 'DELETE' }),
  addMember: (id, body) => API.request(`/api/projects/${id}/members`, { method: 'POST', body: JSON.stringify(body) }),
  removeMember: (pid, mid) => API.request(`/api/projects/${pid}/members/${mid}`, { method: 'DELETE' }),
  // Tasks
  createTask: (pid, body) => API.request(`/api/projects/${pid}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  getTask: (id) => API.request(`/api/tasks/${id}`),
  updateTask: (id, body) => API.request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateStatus: (id, status) => API.request(`/api/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTask: (id) => API.request(`/api/tasks/${id}`, { method: 'DELETE' }),
  getMembers: (pid) => API.request(`/api/projects/${pid}/members`),
};
