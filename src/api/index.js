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
  login: (email, password) => http.post('/auth/login', { email, password }),
};

// ── Accounts ──
export const AccountsApi = {
  getAll:    () => http.get('/admin/accounts'),
  getOne:    (id) => http.get(`/admin/accounts/${id}`),
  setStatus: (id, status) => http.put(`/admin/accounts/${id}/status`, { status }),
  ban:       (id) => http.post(`/admin/accounts/${id}/ban`),
  unban:     (id) => http.post(`/admin/accounts/${id}/unban`),
};

// ── Partners ──
export const PartnersApi = {
  getAll:  () => http.get('/admin/partners'),
  update:  (id, data) => http.put(`/admin/partners/${id}`, data),
  delete:  (id) => http.delete(`/admin/partners/${id}`),
  approve: (id) => http.post(`/admin/partners/${id}/approve`),
};

// ── Categories ──
export const CategoriesApi = {
  getAll:    () => http.get('/admin/categories'),
  create:    (data) => http.post('/admin/categories', data),
  update:    (id, data) => http.put(`/admin/categories/${id}`, data),
  delete:    (id) => http.delete(`/admin/categories/${id}`),
  setStatus: (id, status) => http.put(`/admin/categories/${id}/status`, { status }),
};

// ── Fees ──
export const FeesApi = {
  getAll:         () => http.get('/admin/fees'),
  updateService:  (data) => http.put('/admin/fees/service', data),
  updateShipping: (data) => http.put('/admin/fees/shipping', data),
  create:         (data) => http.post('/admin/fees', data),
  setStatus:      (id, status) => http.put(`/admin/fees/${id}/status`, { status }),
  delete:         (id) => http.delete(`/admin/fees/${id}`),
};

// ── Disputes ──
export const DisputesApi = {
  getAll:        () => http.get('/admin/disputes'),
  getOne:        (id) => http.get(`/admin/disputes/${id}`),
  resolve:       (id, data) => http.put(`/admin/disputes/${id}/resolve`, data),
  refund:        (id, refund_amount) => http.post(`/admin/disputes/${id}/refund`, { refund_amount }),
  reject:        (id, reason) => http.post(`/admin/disputes/${id}/reject`, { reason }),
  getRefunds:    () => http.get('/admin/refunds'),
  approveRefund: (id) => http.post(`/admin/refunds/${id}/approve`),
};

// ── Vouchers ──
export const VouchersApi = {
  getAll:     () => http.get('/admin/vouchers'),
  getStats:   () => http.get('/admin/vouchers/stats'),
  create:     (data) => http.post('/admin/vouchers', data),
  update:     (id, data) => http.put(`/admin/vouchers/${id}`, data),
  delete:     (id) => http.delete(`/admin/vouchers/${id}`),
  activate:   (id) => http.post(`/admin/vouchers/${id}/activate`),
  deactivate: (id) => http.post(`/admin/vouchers/${id}/deactivate`),
};
