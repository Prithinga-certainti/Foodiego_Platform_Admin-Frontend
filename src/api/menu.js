import axios from 'axios';

const api = axios.create({ baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:9877') + '/api/v1' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) { localStorage.clear(); window.location.href = '/login'; }
  return Promise.reject(err);
});

export const getMenuStats = () => api.get('/menu/stats').then(r => r.data);
export const getMenuRequests = (params) => api.get('/menu', { params }).then(r => r.data);
export const getMenuItems = (id) => api.get(`/menu/${id}/items`).then(r => r.data);
export const submitMenuRequest = (data) => api.post('/menu', data).then(r => r.data);
export const approveMenuItem = (itemId) => api.put(`/menu/items/${itemId}/approve`).then(r => r.data);
export const rejectMenuItem = (itemId, reason) => api.put(`/menu/items/${itemId}/reject`, { reason }).then(r => r.data);
export const bulkApproveMenu = (id) => api.put(`/menu/${id}/bulk-approve`).then(r => r.data);
export const bulkRejectMenu = (id, reason) => api.put(`/menu/${id}/bulk-reject`, { reason }).then(r => r.data);

export default api;
