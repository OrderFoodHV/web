import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Modal } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  AppstoreOutlined,
  DollarOutlined,
  ExceptionOutlined,
  GiftOutlined,
  LogoutOutlined,
  ReloadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Sider, Content } = Layout;

const menuSections = [
  {
    type: 'group',
    label: 'Tổng quan',
    children: [
      { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    ],
  },
  {
    type: 'group',
    label: 'Quản lý',
    children: [
      { key: '/accounts', icon: <UserOutlined />, label: 'Tài khoản' },
      { key: '/partners', icon: <ShopOutlined />, label: 'Đối tác' },
      { key: '/categories', icon: <AppstoreOutlined />, label: 'Danh mục' },
      { key: '/fees', icon: <DollarOutlined />, label: 'Phí dịch vụ' },
    ],
  },
  {
    type: 'group',
    label: 'Hỗ trợ',
    children: [
      { key: '/disputes', icon: <ExceptionOutlined />, label: 'Tranh chấp' },
    ],
  },
  {
    type: 'group',
    label: 'Marketing',
    children: [
      { key: '/vouchers', icon: <GiftOutlined />, label: 'Voucher hệ thống' },
    ],
  },
];

const pageMeta = {
  '/':           { title: 'Dashboard',    sub: 'Tổng quan hệ thống' },
  '/accounts':   { title: 'Tài khoản',   sub: 'Quản lý người dùng' },
  '/partners':   { title: 'Đối tác',     sub: 'Quản lý đối tác' },
  '/categories': { title: 'Danh mục',    sub: 'Quản lý danh mục' },
  '/fees':       { title: 'Phí dịch vụ', sub: 'Cấu hình phí' },
  '/disputes':   { title: 'Tranh chấp',  sub: 'Giải quyết khiếu nại' },
  '/vouchers':   { title: 'Voucher',     sub: 'Voucher hệ thống' },
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const meta = pageMeta[location.pathname] || { title: 'Admin', sub: '' };

  const handleLogout = () => {
    Modal.confirm({
      title: 'Đăng xuất',
      content: 'Bạn có chắc muốn đăng xuất?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => {
        logout();
        navigate('/login');
      },
    });
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="admin-layout" style={{ minHeight: '100vh' }}>
      <Sider
        width={260}
        collapsedWidth={72}
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🍔</div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <h3>Food App</h3>
              <span>Admin Portal</span>
            </div>
          )}
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuSections}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1 }}
        />

        {/* Footer */}
        {!collapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <Avatar style={{ background: '#6366f1' }} icon={<UserOutlined />} />
              <div className="sidebar-user-info">
                <div className="name">{user?.name || 'Admin'}</div>
                <div className="role">Quản trị viên</div>
              </div>
            </div>
          </div>
        )}
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 72 : 260, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            <div className="page-header-left">
              <h2>{meta.title}</h2>
              <p>{meta.sub}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              Làm mới
            </Button>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                style={{ background: '#6366f1', cursor: 'pointer' }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </div>
        </div>

        {/* Content */}
        <Content className="page-content">
          <Outlet context={{ refreshKey }} />
        </Content>
      </Layout>
    </Layout>
  );
}
