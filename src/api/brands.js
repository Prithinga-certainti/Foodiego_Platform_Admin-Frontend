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

export const getBrands = (params) => api.get('/brands', { params }).then(r => r.data);
export const getPendingBrands = () => api.get('/brands/pending').then(r => r.data);
export const createBrand = (data) => api.post('/brands', data).then(r => r.data);
export const approveBrand = (id) => api.put(`/brands/${id}/approve`).then(r => r.data);
export const rejectBrand = (id, reason) => api.put(`/brands/${id}/reject`, { reason }).then(r => r.data);
export const suspendBrand = (id, data) => api.put(`/brands/${id}/suspend`, data).then(r => r.data);
export const reactivateBrand = (id) => api.put(`/brands/${id}/reactivate`).then(r => r.data);

export const getRestaurants = (params) => api.get('/restaurants', { params }).then(r => r.data);
export const getPendingRestaurants = () => api.get('/restaurants/pending').then(r => r.data);
export const createRestaurant = (data) => api.post('/restaurants', data).then(r => r.data);
export const approveRestaurant = (id) => api.put(`/restaurants/${id}/approve`).then(r => r.data);
export const rejectRestaurant = (id, reason) => api.put(`/restaurants/${id}/reject`, { reason }).then(r => r.data);
export const suspendRestaurant = (id, data) => api.put(`/restaurants/${id}/suspend`, data).then(r => r.data);
