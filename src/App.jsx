import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import PartnersPage from './pages/PartnersPage';
import ShippersPage from './pages/ShippersPage';
import CategoriesPage from './pages/CategoriesPage';
import FeesPage from './pages/FeesPage';
import DisputesPage from './pages/DisputesPage';
import VouchersPage from './pages/VouchersPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={viVN}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="partners" element={<PartnersPage />} />
              <Route path="shippers" element={<ShippersPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="fees" element={<FeesPage />} />
              <Route path="disputes" element={<DisputesPage />} />
              <Route path="vouchers" element={<VouchersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
