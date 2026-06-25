import axios from 'axios';

const api = axios.create({ baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:3005') + '/api/v1' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = (process.env.PUBLIC_URL || '') + '/login';
    }
    return Promise.reject(err);
  }
);

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const getKPI = () =>
  api.get('/reports/kpi').then((r) => r.data);

export const getDailyRevenue = () =>
  api.get('/reports/revenue/daily').then((r) => r.data);

export const getOrderSummary = () =>
  api.get('/reports/orders/summary').then((r) => r.data);

export const getTopItems = () =>
  api.get('/reports/top-items').then((r) => r.data);

export const getRecentOrders = () =>
  api.get('/reports/recent-orders').then((r) => r.data);

export const getOverviewStats = () => api.get('/reports/overview').then(r => r.data);
export const getBrandPerformance = () => api.get('/reports/brand-performance').then(r => r.data);
export const getCityStats = () => api.get('/reports/city-stats').then(r => r.data);
export const getMonthlyRevenue = () => api.get('/reports/monthly-revenue').then(r => r.data);
export const getPendingApprovals = () => api.get('/reports/pending-approvals').then(r => r.data);

export default api;
