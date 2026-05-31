import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Table, Tag, Input, Select, Button, Space, Modal, Form, message, Popconfirm, Tooltip } from 'antd';
import { ShopOutlined, SearchOutlined, CheckOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { PartnersApi } from '../api';

const statusMap = {
  active:   { color: 'green',  text: 'Hoạt động' },
  pending:  { color: 'orange', text: 'Chờ duyệt' },
  inactive: { color: 'default', text: 'Tạm dừng' },
};

export default function PartnersPage() {
  const { refreshKey } = useOutletContext();
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => { loadData(); }, [refreshKey]);

  useEffect(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        [p.name, p.phone, p.address].some((v) => (v || '').toLowerCase().includes(q))
      );
    }
    if (statusFilter) result = result.filter((p) => p.status === statusFilter);
    setFiltered(result);
  }, [data, search, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await PartnersApi.getAll();
      setData(res);
      setSearch(''); setStatusFilter('');
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    try { await PartnersApi.approve(id); message.success('Đã duyệt đối tác'); loadData(); }
    catch (e) { message.error(e.message); }
  };

  const handleDelete = async (id) => {
    try { await PartnersApi.delete(id); message.success('Đã xóa đối tác'); loadData(); }
    catch (e) { message.error(e.message); }
  };

  const openEdit = (id) => {
    setEditingId(id);
    form.setFieldsValue({ status: 'active' });
    setEditModal(true);
  };

  const handleEdit = async () => {
    try {
      const values = await form.validateFields();
      await PartnersApi.update(editingId, values);
      message.success('Đã cập nhật');
      setEditModal(false);
      loadData();
    } catch (e) {
      if (e.message) message.error(e.message);
    }
  };

  const columns = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Tên', dataIndex: 'name', render: (v) => <strong>{v || '—'}</strong> },
    { title: 'SĐT', dataIndex: 'phone', render: (v) => v || '—' },
    { title: 'Địa chỉ', dataIndex: 'address', render: (v) => v ? <Tooltip title={v}><span>{v}</span></Tooltip> : '—', ellipsis: true },
    {
      title: 'Trạng thái', dataIndex: 'status',
      render: (v) => {
        const s = statusMap[v] || { color: 'default', text: v || '?' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: 'Hành động', width: 180,
      render: (_, record) => (
        <Space>
          {record.status !== 'active' && (
            <Button type="primary" size="small" icon={<CheckOutlined />}
              onClick={() => handleApprove(record.id)}
              style={{ background: '#10b981', borderColor: '#10b981' }}>
              Duyệt
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record.id)} />
          <Popconfirm
            title="Xóa đối tác"
            description={`Xóa đối tác "${record.name}"?`}
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
      <Card title={<span><ShopOutlined style={{ marginRight: 8 }} />Quản lý đối tác</span>}>
        <div className="filter-bar">
          <Input
            placeholder="Tìm theo tên, địa chỉ..."
            prefix={<SearchOutlined />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            placeholder="Tất cả trạng thái"
            allowClear
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            style={{ width: 160 }}
            options={[
              { value: 'active', label: 'Hoạt động' },
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'inactive', label: 'Tạm dừng' },
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
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ margin: 0, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Tên đối tác:</strong> {record.name}</p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Số điện thoại:</strong> {record.phone || '—'}</p>
                <p style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.6' }}><strong>Địa chỉ đầy đủ:</strong> {record.address || '—'}</p>
              </div>
            ),
            rowExpandable: (record) => !!record.address,
          }}
        />
      </Card>

      <Modal
        title="Cập nhật đối tác"
        open={editModal}
        onOk={handleEdit}
        onCancel={() => setEditModal(false)}
        okText="Lưu" cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
            <Select options={[
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Tạm dừng' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
