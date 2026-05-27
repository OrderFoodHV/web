import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Table, Tag, Input, Select, Button, Space, message, Popconfirm } from 'antd';
import { SearchOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { ShippersApi } from '../api';

const statusMap = {
  pending:    { color: 'orange', text: 'Chờ duyệt' },
  idle:       { color: 'green',  text: 'Sẵn sàng (Rảnh)' },
  delivering: { color: 'blue',   text: 'Đang giao hàng' },
  offline:    { color: 'default', text: 'Ngoại tuyến' },
  blocked:    { color: 'red',    text: 'Đang bị khóa 🔒' },
};

export default function ShippersPage() {
  const { refreshKey } = useOutletContext();
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadData(); }, [refreshKey]);

  useEffect(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        [s.shipper_name, s.shipper_email, s.phone, s.vehicle].some((v) => (v || '').toLowerCase().includes(q))
      );
    }
    if (statusFilter) result = result.filter((s) => s.status === statusFilter);
    setFiltered(result);
  }, [data, search, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ShippersApi.getAll();
      setData(res);
      setSearch(''); setStatusFilter('');
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    try {
      await ShippersApi.approve(id);
      message.success('Đã phê duyệt tài xế thành công! 🎉');
      loadData();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleBlock = async (id) => {
    try {
      await ShippersApi.block(id);
      message.success('Đã tạm khóa tài xế! 🔒');
      loadData();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleUnblock = async (id) => {
    try {
      await ShippersApi.unblock(id);
      message.success('Đã mở khóa tài xế! 🔓');
      loadData();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await ShippersApi.delete(id);
      message.success('Đã xóa hồ sơ tài xế!');
      loadData();
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Tên tài xế', dataIndex: 'shipper_name', render: (v) => <strong>{v || '—'}</strong> },
    { title: 'Email', dataIndex: 'shipper_email', render: (v) => v || '—' },
    { title: 'SĐT', dataIndex: 'phone', render: (v) => v || '—' },
    { title: 'Phương tiện / Biển số', dataIndex: 'vehicle', render: (v) => v || '—' },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'created_at',
      render: (v) => v ? new Date(v).toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }) : '—'
    },
    {
      title: 'Trạng thái', dataIndex: 'status',
      render: (v) => {
        const s = statusMap[v] || { color: 'default', text: v || '?' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: 'Hành động', width: 220,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <Button type="primary" size="small" icon={<CheckOutlined />}
              onClick={() => handleApprove(record.id)}
              style={{ background: '#10b981', borderColor: '#10b981' }}>
              Duyệt
            </Button>
          )}
          {record.status !== 'pending' && record.status !== 'blocked' && (
            <Button type="primary" danger size="small"
              onClick={() => handleBlock(record.id)}>
              Khóa
            </Button>
          )}
          {record.status === 'blocked' && (
            <Button type="primary" size="small"
              onClick={() => handleUnblock(record.id)}
              style={{ background: '#6366f1', borderColor: '#6366f1' }}>
              Mở khóa
            </Button>
          )}
          <Popconfirm
            title="Xóa tài xế"
            description={`Xóa tài xế "${record.shipper_name || 'này'}" khỏi danh sách? Thao tác này sẽ hủy quyền tài xế của người dùng.`}
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa" cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '20px' }}>🏍️</span>
          <span>Quản lý Tài xế (Shipper)</span>
        </div>
      }>
        <div className="filter-bar">
          <Input
            placeholder="Tìm theo tên, email, số điện thoại, phương tiện..."
            prefix={<SearchOutlined />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 340 }}
          />
          <Select
            placeholder="Tất cả trạng thái"
            allowClear
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            style={{ width: 180 }}
            options={[
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'idle', label: 'Sẵn sàng (Rảnh)' },
              { value: 'delivering', label: 'Đang giao hàng' },
              { value: 'offline', label: 'Ngoại tuyến' },
              { value: 'blocked', label: 'Đang bị khóa 🔒' },
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
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </>
  );
}
