import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Table, Tag, Input, Select, Button, Space, Modal, Form, InputNumber, DatePicker, message, Popconfirm } from 'antd';
import { GiftOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, PauseOutlined, CaretRightOutlined } from '@ant-design/icons';
import { VouchersApi } from '../api';
import dayjs from 'dayjs';

const fmtDate = v => v ? new Date(v).toLocaleDateString('vi-VN') : '—';
const fmtNum = n => n != null ? Number(n).toLocaleString('vi-VN') : '—';
const statusMap = {
  active:   { color: 'green',  text: 'Hoạt động' },
  inactive: { color: 'default', text: 'Tạm dừng' },
  expired:  { color: 'red',    text: 'Hết hạn' },
};

export default function VouchersPage() {
  const { refreshKey } = useOutletContext();
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => { loadData(); }, [refreshKey]);

  useEffect(() => {
    let result = data;
    if (search) { const q = search.toLowerCase(); result = result.filter(v => (v.code || '').toLowerCase().includes(q)); }
    if (typeFilter) result = result.filter(v => v.discount_type === typeFilter);
    if (statusFilter) result = result.filter(v => v.status === statusFilter);
    setFiltered(result);
  }, [data, search, typeFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try { setData(await VouchersApi.getAll()); setSearch(''); setTypeFilter(''); setStatusFilter(''); }
    catch (e) { message.error(e.message); }
    setLoading(false);
  };

  const openModal = (v = null) => {
    setEditing(v);
    if (v) {
      form.setFieldsValue({
        code: v.code, discount_type: v.discount_type, discount_value: v.discount_value,
        quantity: v.quantity, min_order_amount: v.min_order_amount || 0,
        start_date: v.start_date ? dayjs(v.start_date) : null,
        end_date: v.end_date ? dayjs(v.end_date) : null,
      });
    } else { form.resetFields(); }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD') || '',
        end_date: values.end_date?.format('YYYY-MM-DD') || '',
      };
      editing ? await VouchersApi.update(editing.id, payload) : await VouchersApi.create(payload);
      message.success(editing ? 'Đã cập nhật' : 'Đã tạo voucher');
      setModalOpen(false); loadData();
    } catch (e) { if (e.message) message.error(e.message); }
  };

  const handleToggle = async (id, action) => {
    try {
      action === 'activate' ? await VouchersApi.activate(id) : await VouchersApi.deactivate(id);
      message.success('Đã cập nhật trạng thái'); loadData();
    } catch (e) { message.error(e.message); }
  };

  const handleDelete = async (id) => {
    try { await VouchersApi.delete(id); message.success('Đã xóa voucher'); loadData(); }
    catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Mã', dataIndex: 'code', render: v => <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{v}</code> },
    { title: 'Loại', dataIndex: 'discount_type', render: v => v === 'percent' ? '%' : 'Cố định' },
    { title: 'Giá trị', dataIndex: 'discount_value', render: (v, r) => <strong>{r.discount_type === 'percent' ? v + '%' : fmtNum(v) + 'đ'}</strong> },
    { title: 'Đã dùng', render: (_, r) => `${r.used_count || 0}/${r.quantity}` },
    { title: 'Số lượng', dataIndex: 'quantity' },
    { title: 'Hết hạn', dataIndex: 'end_date', render: fmtDate },
    { title: 'Trạng thái', dataIndex: 'status', render: v => { const s = statusMap[v] || { color: 'default', text: v }; return <Tag color={s.color}>{s.text}</Tag>; } },
    { title: 'Hành động', width: 150, render: (_, r) => (
        <Space>
          {r.status === 'active'
            ? <Button size="small" icon={<PauseOutlined />} style={{ color: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => handleToggle(r.id, 'deactivate')} />
            : <Button size="small" icon={<CaretRightOutlined />} style={{ color: '#10b981', borderColor: '#10b981' }} onClick={() => handleToggle(r.id, 'activate')} />
          }
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Popconfirm title={`Xóa voucher "${r.code}"?`} onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card title={<span><GiftOutlined style={{ marginRight: 8 }} />Voucher hệ thống</span>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Tạo voucher</Button>}>
        <div className="filter-bar">
          <Input placeholder="Tìm theo mã voucher..." prefix={<SearchOutlined />} allowClear value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
          <Select placeholder="Tất cả loại" allowClear value={typeFilter || undefined} onChange={v => setTypeFilter(v || '')} style={{ width: 150 }}
            options={[{ value: 'percent', label: 'Phần trăm (%)' }, { value: 'fixed', label: 'Cố định (đ)' }]} />
          <Select placeholder="Tất cả trạng thái" allowClear value={statusFilter || undefined} onChange={v => setStatusFilter(v || '')} style={{ width: 150 }}
            options={[{ value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Tạm dừng' }, { value: 'expired', label: 'Hết hạn' }]} />
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Hiển thị <strong>{filtered.length}</strong> / {data.length}</span>
        </div>
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 900 }} size="middle" />
      </Card>

      <Modal title={editing ? 'Sửa voucher' : 'Tạo voucher hệ thống'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText={editing ? 'Lưu' : 'Tạo'} cancelText="Hủy" width={520}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space.Compact style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="Mã voucher" name="code" rules={[{ required: true, message: 'Nhập mã' }]}><Input placeholder="SALE20" /></Form.Item>
            <Form.Item label="Loại giảm giá" name="discount_type" initialValue="percent">
              <Select options={[{ value: 'percent', label: 'Phần trăm (%)' }, { value: 'fixed', label: 'Cố định (đ)' }]} />
            </Form.Item>
            <Form.Item label="Giá trị" name="discount_value" rules={[{ required: true, message: 'Nhập giá trị' }]}><InputNumber style={{ width: '100%' }} min={0} placeholder="20" /></Form.Item>
            <Form.Item label="Số lượng" name="quantity" rules={[{ required: true, message: 'Nhập SL' }]}><InputNumber style={{ width: '100%' }} min={1} placeholder="100" /></Form.Item>
            <Form.Item label="Ngày bắt đầu" name="start_date"><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item label="Ngày kết thúc" name="end_date"><DatePicker style={{ width: '100%' }} /></Form.Item>
          </Space.Compact>
          <Form.Item label="Đơn tối thiểu" name="min_order_amount" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
