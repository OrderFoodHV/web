import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { useOutletContext } from 'react-router-dom';
import {
  UserOutlined,
  ShopOutlined,
  ExceptionOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { AccountsApi, PartnersApi, DisputesApi, VouchersApi } from '../api';

const statConfig = [
  {
    key: 'accounts',
    title: 'Tổng tài khoản',
    icon: <UserOutlined />,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
  },
  {
    key: 'partners',
    title: 'Đối tác',
    icon: <ShopOutlined />,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
  },
  {
    key: 'disputes',
    title: 'Tranh chấp',
    icon: <ExceptionOutlined />,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
  },
  {
    key: 'vouchers',
    title: 'Voucher',
    icon: <GiftOutlined />,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
];

export default function DashboardPage() {
  const { refreshKey } = useOutletContext();
  const [stats, setStats] = useState({ accounts: 0, partners: 0, disputes: 0, vouchers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const loadStats = async () => {
    setLoading(true);
    const [accounts, partners, disputes, vouchers] = await Promise.allSettled([
      AccountsApi.getAll(),
      PartnersApi.getAll(),
      DisputesApi.getAll(),
      VouchersApi.getAll(),
    ]);
    setStats({
      accounts: accounts.value?.length ?? 0,
      partners: partners.value?.length ?? 0,
      disputes: disputes.value?.length ?? 0,
      vouchers: vouchers.value?.length ?? 0,
    });
    setLoading(false);
  };

  return (
    <div>
      <Row gutter={[20, 20]}>
        {statConfig.map((s) => (
          <Col xs={24} sm={12} lg={6} key={s.key}>
            <Card className="stat-card" loading={loading}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <Statistic title={s.title} value={stats[s.key]} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 20 }}>
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>Chào mừng trở lại 👋</h3>
        <p style={{ color: '#94a3b8', marginTop: 8, marginBottom: 0 }}>
          Chọn một mục ở thanh bên để bắt đầu quản lý hệ thống.
        </p>
      </Card>
    </div>
  );
}
