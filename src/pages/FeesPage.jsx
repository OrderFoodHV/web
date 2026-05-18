import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Row, Col, message, Popconfirm } from 'antd';
import { DollarOutlined, PlusOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { FeesApi } from '../api';

const fmtNum = n => n != null ? Number(n).toLocaleString('vi-VN') : '—';

export default function FeesPage() {
  const { refreshKey } = useOutletContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [svcForm] = Form.useForm();
  const [shipForm] = Form.useForm();
  const [newForm] = Form.useForm();

  useEffect(() => { loadData(); }, [refreshKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await FeesApi.getAll();
      setData(res);
      const svc = res.find(f => f.fee_type === 'service_fee');
      const shp = res.find(f => f.fee_type === 'shipping_fee');
      if (svc) svcForm.setFieldsValue({ fee_value: svc.fee_value, fee_description: svc.fee_description || '' });
      if (shp) shipForm.setFieldsValue({ fee_value: shp.fee_value, fee_description: shp.fee_description || '' });
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  const updateFee = async (type) => {
    try {
      const form = type === 'service' ? svcForm : shipForm;
      const values = await form.validateFields();
      type === 'service' ? await FeesApi.updateService(values) : await FeesApi.updateShipping(values);
      message.success('Đã cập nhật phí'); loadData();
    } catch (e) { if (e.message) message.error(e.message); }
  };

  const handleCreate = async () => {
    try {
      const values = await newForm.validateFields();
      await FeesApi.create(values);
      message.success('Đã tạo cấu hình phí'); setModalOpen(false); loadData();
    } catch (e) { if (e.message) message.error(e.message); }
  };

  const handleDelete = async (id) => {
    try { await FeesApi.delete(id); message.success('Đã xóa'); loadData(); }
    catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Loại phí', dataIndex: 'fee_type' },
    { title: 'Giá trị', dataIndex: 'fee_value', render: v => fmtNum(v) },
    { title: 'Mô tả', dataIndex: 'fee_description', render: v => v || '—' },
    { title: 'Trạng thái', dataIndex: 'status', render: v => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? 'Hoạt động' : 'Tạm dừng'}</Tag> },
    { title: 'Cập nhật', dataIndex: 'updated_at', render: v => v ? new Date(v).toLocaleDateString('vi-VN') : '—' },
    { title: 'Hành động', width: 80, render: (_, r) => (
        <Popconfirm title="Xóa cấu hình này?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[20, 20]}>
        <Col xs={24} md={12}>
          <Card title="💰 Phí dịch vụ">
            <Form form={svcForm} layout="vertical">
              <Form.Item label="Giá trị phí" name="fee_value" rules={[{ required: true, message: 'Nhập giá trị' }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
              <Form.Item label="Mô tả" name="fee_description">
                <Input placeholder="Phí dịch vụ..." />
              </Form.Item>
              <Button type="primary" icon={<SaveOutlined />} block onClick={() => updateFee('service')}>Lưu thay đổi</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="🚚 Phí vận chuyển">
            <Form form={shipForm} layout="vertical">
              <Form.Item label="Giá trị phí" name="fee_value" rules={[{ required: true, message: 'Nhập giá trị' }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
              <Form.Item label="Mô tả" name="fee_description">
                <Input placeholder="Phí vận chuyển..." />
              </Form.Item>
              <Button type="primary" icon={<SaveOutlined />} block onClick={() => updateFee('shipping')}>Lưu thay đổi</Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card title="Tất cả cấu hình phí" style={{ marginTop: 20 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { newForm.resetFields(); setModalOpen(true); }}>Thêm mới</Button>}>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false} scroll={{ x: 600 }} size="middle" />
      </Card>

      <Modal title="Thêm cấu hình phí" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)} okText="Tạo" cancelText="Hủy">
        <Form form={newForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Loại phí" name="fee_type" rules={[{ required: true, message: 'Nhập loại phí' }]}>
            <Input placeholder="vd: platform_fee" />
          </Form.Item>
          <Form.Item label="Giá trị" name="fee_value" rules={[{ required: true, message: 'Nhập giá trị' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item label="Mô tả" name="fee_description">
            <Input placeholder="Mô tả..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
