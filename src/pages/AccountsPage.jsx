import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Table, Tag, Input, Select, Button, Space, Modal, message } from 'antd';
import { UserOutlined, LockOutlined, UnlockOutlined, SearchOutlined } from '@ant-design/icons';
import { AccountsApi } from '../api';

const roleColors = { admin: 'purple', customer: 'blue', shipper: 'cyan' };
const statusMap = {
  active:   { color: 'green',  text: 'Hoạt động' },
  inactive: { color: 'orange', text: 'Tạm dừng' },
  banned:   { color: 'red',    text: 'Bị khóa' },
};

export default function AccountsPage() {
  const { refreshKey } = useOutletContext();
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadData(); }, [refreshKey]);

  useEffect(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        [a.name, a.email, a.phone].some((v) => (v || '').toLowerCase().includes(q))
      );
    }
    if (roleFilter) result = result.filter((a) => (a.role || 'customer') === roleFilter);
    if (statusFilter) result = result.filter((a) => (a.status || 'active') === statusFilter);
    setFiltered(result);
  }, [data, search, roleFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await AccountsApi.getAll();
      setData(res);
      setSearch(''); setRoleFilter(''); setStatusFilter('');
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  const handleBan = (record) => {
    Modal.confirm({
      title: 'Khóa tài khoản',
      content: `Bạn có chắc muốn khóa tài khoản "${record.name}"?`,
      okText: 'Khóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try { await AccountsApi.ban(record.id); message.success('Đã khóa tài khoản'); loadData(); }
        catch (e) { message.error(e.message); }
      },
    });
  };

  const handleUnban = async (id) => {
    try { await AccountsApi.unban(id); message.success('Đã mở khóa tài khoản'); loadData(); }
    catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Tên', dataIndex: 'name', render: (v) => <strong>{v || '—'}</strong> },
    { title: 'Email', dataIndex: 'email' },
    { title: 'SĐT', dataIndex: 'phone', render: (v) => v || '—' },
    {
      title: 'Role', dataIndex: 'role',
      render: (v) => <Tag color={roleColors[v] || 'default'}>{v || 'customer'}</Tag>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status',
      render: (v) => {
        const s = statusMap[v] || statusMap.active;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: 'Ngày tạo', dataIndex: 'created_at',
      render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Hành động', width: 120,
      render: (_, record) => (
        <Space>
          {(record.status === 'banned') ? (
            <Button type="primary" size="small" icon={<UnlockOutlined />}
              onClick={() => handleUnban(record.id)}
              style={{ background: '#10b981', borderColor: '#10b981' }}>
              Mở khóa
            </Button>
          ) : (
            <Button danger size="small" icon={<LockOutlined />}
              onClick={() => handleBan(record)}>
              Khóa
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<span><UserOutlined style={{ marginRight: 8 }} />Quản lý tài khoản</span>}
    >
      <div className="filter-bar">
        <Input
          placeholder="Tìm theo tên, email, SĐT..."
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
        <Select
          placeholder="Tất cả vai trò"
          allowClear
          value={roleFilter || undefined}
          onChange={(v) => setRoleFilter(v || '')}
          style={{ width: 160 }}
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'customer', label: 'Khách hàng' },
            { value: 'shipper', label: 'Shipper' },
          ]}
        />
        <Select
          placeholder="Tất cả trạng thái"
          allowClear
          value={statusFilter || undefined}
          onChange={(v) => setStatusFilter(v || '')}
          style={{ width: 160 }}
          options={[
            { value: 'active', label: 'Hoạt động' },
            { value: 'inactive', label: 'Tạm dừng' },
            { value: 'banned', label: 'Bị khóa' },
          ]}
        />
        <span style={{ color: '#94a3b8', fontSize: 13 }}>
          Hiển thị <strong>{filtered.length}</strong> / {data.length}
        </span>
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Tổng ${t}` }}
        scroll={{ x: 900 }}
        size="middle"
      />
    </Card>
  );
}
