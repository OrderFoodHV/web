import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Table, Tag, Input, Select, Button, Space, Modal, Form, InputNumber, message } from 'antd';
import { ExceptionOutlined, SearchOutlined, CheckOutlined, DollarOutlined, CloseOutlined } from '@ant-design/icons';
import { DisputesApi } from '../api';

const statusMap = {
  pending:  { color: 'orange', text: 'Chờ xử lý' },
  resolved: { color: 'green',  text: 'Đã giải quyết' },
  rejected: { color: 'red',    text: 'Từ chối' },
  refunded: { color: 'blue',   text: 'Hoàn tiền' },
};
const fmtDate = v => v ? new Date(v).toLocaleDateString('vi-VN') : '—';
const fmtNum = n => n != null ? Number(n).toLocaleString('vi-VN') : '—';

export default function DisputesPage() {
  const { refreshKey } = useOutletContext();
  const [disputes, setDisputes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [resolveModal, setResolveModal] = useState(false);
  const [refundModal, setRefundModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [resolveForm] = Form.useForm();
  const [refundForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  useEffect(() => { loadData(); }, [refreshKey]);

  useEffect(() => {
    let result = disputes;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        [String(d.order_id), d.user_name, d.partner_name, d.reason].some(v => (v || '').toLowerCase().includes(q))
      );
    }
    if (statusFilter) result = result.filter(d => d.status === statusFilter);
    setFiltered(result);
  }, [disputes, search, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([DisputesApi.getAll(), DisputesApi.getRefunds()]);
      setDisputes(d); setRefunds(r);
      setSearch(''); setStatusFilter('');
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  const openResolve = (id) => { setActiveId(id); resolveForm.resetFields(); setResolveModal(true); };
  const openRefund = (id) => { setActiveId(id); refundForm.resetFields(); setRefundModal(true); };
  const openReject = (id) => { setActiveId(id); rejectForm.resetFields(); setRejectModal(true); };

  const handleResolve = async () => {
    try {
      const v = await resolveForm.validateFields();
      await DisputesApi.resolve(activeId, v);
      message.success('Đã giải quyết'); setResolveModal(false); loadData();
    } catch (e) { if (e.message) message.error(e.message); }
  };

  const handleRefund = async () => {
    try {
      const v = await refundForm.validateFields();
      await DisputesApi.refund(activeId, v.refund_amount);
      message.success('Đã hoàn tiền'); setRefundModal(false); loadData();
    } catch (e) { if (e.message) message.error(e.message); }
  };

  const handleReject = async () => {
    try {
      const v = await rejectForm.validateFields();
      await DisputesApi.reject(activeId, v.reason);
      message.success('Đã từ chối'); setRejectModal(false); loadData();
    } catch (e) { if (e.message) message.error(e.message); }
  };

  const handleApproveRefund = async (id) => {
    try { await DisputesApi.approveRefund(id); message.success('Đã duyệt hoàn tiền'); loadData(); }
    catch (e) { message.error(e.message); }
  };

  const disputeCols = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Đơn hàng', dataIndex: 'order_id', render: v => `#${v}` },
    { title: 'Khách hàng', dataIndex: 'user_name', render: (v, r) => v || r.user_id },
    { title: 'Đối tác', dataIndex: 'partner_name', render: (v, r) => v || r.partner_id || '—' },
    { title: 'Lý do', dataIndex: 'reason', render: v => v || '—', ellipsis: true, width: 150 },
    { title: 'Trạng thái', dataIndex: 'status', render: v => { const s = statusMap[v] || { color: 'default', text: v }; return <Tag color={s.color}>{s.text}</Tag>; } },
    { 
      title: 'Bằng chứng giao', 
      dataIndex: 'delivery_photo', 
      render: v => v ? (
        <a href={v} target="_blank" rel="noopener noreferrer">
          <img src={v} alt="Proof" style={{ width: 55, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #e2e8f0' }} />
        </a>
      ) : 'Không có' 
    },
    { title: 'Hoàn tiền', dataIndex: 'refund_amount', render: v => v ? fmtNum(v) + 'đ' : '—' },
    { title: 'Ngày', dataIndex: 'created_at', render: fmtDate },
    { title: 'Hành động', width: 140, render: (_, r) => (r.status === 'pending' || !r.status) ? (
        <Space>
          <Button type="primary" size="small" icon={<CheckOutlined />} style={{ background: '#10b981', borderColor: '#10b981' }} onClick={() => openResolve(r.id)} />
          <Button size="small" icon={<DollarOutlined />} style={{ color: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => openRefund(r.id)} />
          <Button danger size="small" icon={<CloseOutlined />} onClick={() => openReject(r.id)} />
        </Space>
      ) : null,
    },
  ];

  const refundCols = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Đơn hàng', dataIndex: 'order_id', render: v => `#${v}` },
    { title: 'Khách hàng', dataIndex: 'user_name', render: (v, r) => v || r.user_id },
    { title: 'Số tiền', dataIndex: 'amount', render: v => <strong>{fmtNum(v)}đ</strong> },
    { title: 'Lý do', dataIndex: 'reason', render: v => v || '—' },
    { title: 'Ngày', dataIndex: 'created_at', render: fmtDate },
    { title: 'Hành động', width: 100, render: (_, r) => (
        <Button type="primary" size="small" icon={<CheckOutlined />} style={{ background: '#10b981', borderColor: '#10b981' }} onClick={() => handleApproveRefund(r.id)}>Duyệt</Button>
      ),
    },
  ];

  return (
    <>
      <Card title={<span><ExceptionOutlined style={{ marginRight: 8 }} />Tranh chấp</span>} style={{ marginBottom: 20 }}>
        <div className="filter-bar">
          <Input placeholder="Tìm theo đơn hàng, khách hàng, lý do..." prefix={<SearchOutlined />} allowClear value={search} onChange={e => setSearch(e.target.value)} style={{ width: 300 }} />
          <Select placeholder="Tất cả trạng thái" allowClear value={statusFilter || undefined} onChange={v => setStatusFilter(v || '')} style={{ width: 160 }}
            options={[{ value: 'pending', label: 'Chờ xử lý' }, { value: 'resolved', label: 'Đã giải quyết' }, { value: 'rejected', label: 'Từ chối' }, { value: 'refunded', label: 'Hoàn tiền' }]} />
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Hiển thị <strong>{filtered.length}</strong> / {disputes.length}</span>
        </div>
        <Table columns={disputeCols} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 900 }} size="middle" />
      </Card>

      <Card title="🔄 Yêu cầu hoàn tiền đang chờ">
        <Table columns={refundCols} dataSource={refunds} rowKey="id" loading={loading} pagination={false} scroll={{ x: 600 }} size="middle" />
      </Card>

      {/* Resolve Modal */}
      <Modal title="Giải quyết tranh chấp" open={resolveModal} onOk={handleResolve} onCancel={() => setResolveModal(false)} okText="Xác nhận" cancelText="Hủy">
        <Form form={resolveForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Kết quả xử lý" name="resolution"><Input.TextArea rows={3} placeholder="Mô tả cách giải quyết..." /></Form.Item>
          <Form.Item label="Trạng thái" name="status" initialValue="resolved">
            <Select options={[{ value: 'resolved', label: 'Đã giải quyết' }, { value: 'refunded', label: 'Hoàn tiền' }]} />
          </Form.Item>
          <Form.Item label="Số tiền hoàn (nếu có)" name="refund_amount"><InputNumber style={{ width: '100%' }} min={0} placeholder="0" /></Form.Item>
        </Form>
      </Modal>

      {/* Refund Modal */}
      <Modal title="Xử lý hoàn tiền" open={refundModal} onOk={handleRefund} onCancel={() => setRefundModal(false)} okText="Hoàn tiền" cancelText="Hủy">
        <Form form={refundForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Số tiền hoàn" name="refund_amount" rules={[{ required: true, message: 'Nhập số tiền' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="Nhập số tiền hoàn" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal title="Từ chối tranh chấp" open={rejectModal} onOk={handleReject} onCancel={() => setRejectModal(false)} okText="Từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}>
        <Form form={rejectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Lý do từ chối" name="reason"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
