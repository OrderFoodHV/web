import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Switch } from 'antd';
import { DollarOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { FeesApi } from '../api';

const fmtNum = n => n != null ? Number(n).toLocaleString('vi-VN') : '—';

export default function FeesPage() {
  const { refreshKey } = useOutletContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [newForm] = Form.useForm();

  useEffect(() => { loadData(); }, [refreshKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await FeesApi.getAll();
      setData(res);
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    newForm.setFieldsValue({
      fee_type: record.fee_type,
      fee_value: record.fee_value,
      fee_description: record.fee_description || '',
      calculation_type: record.calculation_type || 'fixed',
      condition_type: record.condition_type || 'none',
      condition_value: record.condition_value != null ? Number(record.condition_value) : undefined,
      extra_value: record.extra_value != null ? Number(record.extra_value) : undefined
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await newForm.validateFields();
      if (editingRecord) {
        await FeesApi.update(editingRecord.id, values);
        message.success('Đã cập nhật cấu hình phí');
      } else {
        await FeesApi.create(values);
        message.success('Đã tạo cấu hình phí');
      }
      setModalOpen(false);
      setEditingRecord(null);
      loadData();
    } catch (e) { if (e.message) message.error(e.message); }
  };

  const handleDelete = async (id) => {
    try { await FeesApi.delete(id); message.success('Đã xóa'); loadData(); }
    catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Loại phí', dataIndex: 'fee_type' },
    { 
      title: 'Giá trị', 
      dataIndex: 'fee_value', 
      render: (v, r) => {
        if (r.fee_type === 'shipping_fee') {
          return `${fmtNum(v)} đ (${r.condition_value || 0} km đầu) + ${fmtNum(r.extra_value || 0)} đ/km sau`;
        }
        return r.calculation_type === 'percentage' ? `${v}%` : `${fmtNum(v)} đ`;
      }
    },
    {
      title: 'Điều kiện áp dụng',
      render: (_, r) => {
        if (r.fee_type === 'shipping_fee') {
          return <Tag color="green">Khoảng cách GPS thực tế</Tag>;
        }
        if (r.condition_type === 'under_subtotal') {
          return <Tag color="blue">Dưới {fmtNum(r.condition_value)} đ</Tag>;
        }
        if (r.condition_type === 'above_subtotal') {
          return <Tag color="purple">Từ {fmtNum(r.condition_value)} đ trở lên</Tag>;
        }
        return <Tag color="default">Luôn áp dụng</Tag>;
      }
    },
    { title: 'Mô tả', dataIndex: 'fee_description', render: v => v || '—' },
    { title: 'Trạng thái', dataIndex: 'status', render: (status, r) => (
        <Space>
          <Switch
            checked={status === 'active'}
            onChange={async (checked) => {
              try {
                await FeesApi.setStatus(r.id, checked ? 'active' : 'inactive');
                message.success('Đã cập nhật trạng thái phí');
                loadData();
              } catch (e) {
                message.error(e.message);
              }
            }}
          />
          <Tag color={status === 'active' ? 'green' : 'default'}>
            {status === 'active' ? 'Bật' : 'Tắt'}
          </Tag>
        </Space>
      )
    },
    { title: 'Cập nhật', dataIndex: 'updated_at', render: v => v ? new Date(v).toLocaleDateString('vi-VN') : '—' },
    { title: 'Hành động', width: 120, render: (_, r) => (
        <Space>
          <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => handleEditClick(r)} />
          <Popconfirm title="Xóa cấu hình này?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card title="Tất cả cấu hình phí"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); newForm.resetFields(); setModalOpen(true); }}>Thêm mới</Button>}>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false} scroll={{ x: 800 }} size="middle" />
      </Card>

      <Modal 
        title={editingRecord ? "Chỉnh sửa cấu hình phí" : "Thêm cấu hình phí"} 
        open={modalOpen} 
        onOk={handleSave} 
        onCancel={() => { setModalOpen(false); setEditingRecord(null); }} 
        okText={editingRecord ? "Lưu" : "Tạo"} 
        cancelText="Hủy"
      >
        <Form form={newForm} layout="vertical" style={{ marginTop: 16 }} initialValues={{ calculation_type: 'fixed', condition_type: 'none', extra_value: 0 }}>
          <Form.Item label="Loại phí" name="fee_type" rules={[{ required: true, message: 'Nhập loại phí' }]}>
            <Input placeholder="vd: platform_fee" disabled={!!editingRecord} />
          </Form.Item>
          
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.fee_type !== curr.fee_type}>
            {({ getFieldValue }) => {
              const isShipping = getFieldValue('fee_type') === 'shipping_fee';
              if (isShipping) {
                return (
                  <>
                    <Form.Item label="Phí giao hàng cơ bản (đ)" name="fee_value" rules={[{ required: true, message: 'Nhập phí cơ bản' }]}>
                      <InputNumber style={{ width: '100%' }} min={0} step={1000} placeholder="vd: 15000" />
                    </Form.Item>
                    <Form.Item label="Số km đầu tiên áp dụng phí cơ bản" name="condition_value" rules={[{ required: true, message: 'Nhập số km' }]}>
                      <InputNumber style={{ width: '100%' }} min={0} step={0.5} placeholder="vd: 2" />
                    </Form.Item>
                    <Form.Item label="Phí cộng thêm mỗi km tiếp theo (đ/km)" name="extra_value" rules={[{ required: true, message: 'Nhập phí cộng thêm' }]}>
                      <InputNumber style={{ width: '100%' }} min={0} step={1000} placeholder="vd: 5000" />
                    </Form.Item>
                  </>
                );
              }
              
              return (
                <>
                  <Form.Item label="Cách tính" name="calculation_type" rules={[{ required: true }]}>
                    <Select options={[
                      { value: 'fixed', label: 'Cố định (đ)' },
                      { value: 'percentage', label: 'Phần trăm tiền món (%)' }
                    ]} />
                  </Form.Item>

                  <Form.Item label="Giá trị" name="fee_value" rules={[{ required: true, message: 'Nhập giá trị' }]}>
                    <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                  </Form.Item>

                  <Form.Item label="Điều kiện áp dụng" name="condition_type" rules={[{ required: true }]}>
                    <Select options={[
                      { value: 'none', label: 'Luôn áp dụng' },
                      { value: 'under_subtotal', label: 'Khi tiền món dưới ngưỡng' },
                      { value: 'above_subtotal', label: 'Khi tiền món từ ngưỡng trở lên' }
                    ]} />
                  </Form.Item>

                  <Form.Item noStyle shouldUpdate={(prev, curr) => prev.condition_type !== curr.condition_type}>
                    {({ getFieldValue }) => {
                      const cond = getFieldValue('condition_type');
                      if (cond === 'under_subtotal' || cond === 'above_subtotal') {
                        return (
                          <Form.Item label="Ngưỡng tiền món (đ)" name="condition_value" rules={[{ required: true, message: 'Nhập ngưỡng giá trị tiền món' }]}>
                            <InputNumber style={{ width: '100%' }} min={0} step={1000} placeholder="vd: 40000" />
                          </Form.Item>
                        );
                      }
                      return null;
                    }}
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>

          <Form.Item label="Mô tả" name="fee_description">
            <Input placeholder="Mô tả..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
