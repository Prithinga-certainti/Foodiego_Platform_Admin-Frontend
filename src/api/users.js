import axios from 'axios';

const api = axios.create({ baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:3005') + '/api/v1' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) { localStorage.clear(); window.location.href = (process.env.PUBLIC_URL || '') + '/login'; }
  return Promise.reject(err);
});

export const getUsers = (params) => api.get('/users', { params }).then(r => r.data);
export const getUserById = (id) => api.get(`/users/${id}`).then(r => r.data);
export const createUser = (data) => api.post('/users', data).then(r => r.data);
export const blockUser = (id) => api.put(`/users/${id}/block`).then(r => r.data);
export const unblockUser = (id) => api.put(`/users/${id}/unblock`).then(r => r.data);
export const resetPassword = (id) => api.put(`/users/${id}/reset-password`).then(r => r.data);
export const deleteUser = (id) => api.delete(`/users/${id}`).then(r => r.data);
