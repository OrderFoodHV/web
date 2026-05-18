import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// ── Axios Instance ──
const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: gắn token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwrap data & xử lý lỗi
http.interceptors.response.use(
  (res) => {
    const payload = res.data;
    return payload.data !== undefined ? payload.data : payload;
  },
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Lỗi không xác định';
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(msg));
  }
);

// ── Auth ──
export const AuthApi = {
  login: (email, password) => http.post('/api/auth/login', { email, password }),
};

// ── Accounts ──
export const AccountsApi = {
  getAll:    () => http.get('/api/admin/accounts'),
  getOne:    (id) => http.get(`/api/admin/accounts/${id}`),
  setStatus: (id, status) => http.put(`/api/admin/accounts/${id}/status`, { status }),
  ban:       (id) => http.post(`/api/admin/accounts/${id}/ban`),
  unban:     (id) => http.post(`/api/admin/accounts/${id}/unban`),
};

// ── Partners ──
export const PartnersApi = {
  getAll:  () => http.get('/api/admin/partners'),
  update:  (id, data) => http.put(`/api/admin/partners/${id}`, data),
  delete:  (id) => http.delete(`/api/admin/partners/${id}`),
  approve: (id) => http.post(`/api/admin/partners/${id}/approve`),
};

// ── Categories ──
export const CategoriesApi = {
  getAll:    () => http.get('/api/admin/categories'),
  create:    (data) => http.post('/api/admin/categories', data),
  update:    (id, data) => http.put(`/api/admin/categories/${id}`, data),
  delete:    (id) => http.delete(`/api/admin/categories/${id}`),
  setStatus: (id, status) => http.put(`/api/admin/categories/${id}/status`, { status }),
};

// ── Fees ──
export const FeesApi = {
  getAll:         () => http.get('/api/admin/fees'),
  updateService:  (data) => http.put('/api/admin/fees/service', data),
  updateShipping: (data) => http.put('/api/admin/fees/shipping', data),
  create:         (data) => http.post('/api/admin/fees', data),
  setStatus:      (id, status) => http.put(`/api/admin/fees/${id}/status`, { status }),
  delete:         (id) => http.delete(`/api/admin/fees/${id}`),
};

// ── Disputes ──
export const DisputesApi = {
  getAll:        () => http.get('/api/admin/disputes'),
  getOne:        (id) => http.get(`/api/admin/disputes/${id}`),
  resolve:       (id, data) => http.put(`/api/admin/disputes/${id}/resolve`, data),
  refund:        (id, refund_amount) => http.post(`/api/admin/disputes/${id}/refund`, { refund_amount }),
  reject:        (id, reason) => http.post(`/api/admin/disputes/${id}/reject`, { reason }),
  getRefunds:    () => http.get('/api/admin/refunds'),
  approveRefund: (id) => http.post(`/api/admin/refunds/${id}/approve`),
};

// ── Vouchers ──
export const VouchersApi = {
  getAll:     () => http.get('/api/admin/vouchers'),
  getStats:   () => http.get('/api/admin/vouchers/stats'),
  create:     (data) => http.post('/api/admin/vouchers', data),
  update:     (id, data) => http.put(`/api/admin/vouchers/${id}`, data),
  delete:     (id) => http.delete(`/api/admin/vouchers/${id}`),
  activate:   (id) => http.post(`/api/admin/vouchers/${id}/activate`),
  deactivate: (id) => http.post(`/api/admin/vouchers/${id}/deactivate`),
};
