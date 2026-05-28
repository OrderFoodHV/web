import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Table, Tag, Input, Select, Button, Space, Modal, Form, Switch, message, Popconfirm } from 'antd';
import { AppstoreOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { CategoriesApi } from '../api';
import axios from 'axios';

export default function CategoriesPage() {
  const { refreshKey } = useOutletContext();
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { loadData(); }, [refreshKey]);

  useEffect(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => [c.name, c.description].some(v => (v || '').toLowerCase().includes(q)));
    }
    if (statusFilter) result = result.filter(c => (c.status || 'active') === statusFilter);
    setFiltered(result);
  }, [data, search, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try { setData(await CategoriesApi.getAll()); setSearch(''); setStatusFilter(''); }
    catch (e) { message.error(e.message); }
    setLoading(false);
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const res = await axios.post('http://localhost:3000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data && res.data.success) {
        form.setFieldsValue({ image: res.data.imageUrl });
        setImageUrl(res.data.imageUrl);
        message.success('Tải ảnh lên thành công!');
      } else {
        message.error('Không thể tải ảnh lên.');
      }
    } catch (e) {
      message.error('Lỗi tải ảnh lên: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const openModal = (cat = null) => {
    setEditing(cat);
    if (cat) {
      form.setFieldsValue({ name: cat.name, description: cat.description || '', image: cat.image || '' });
      setImageUrl(cat.image || '');
    } else {
      form.resetFields();
      setImageUrl('');
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      editing ? await CategoriesApi.update(editing.id, values) : await CategoriesApi.create(values);
      message.success(editing ? 'Đã cập nhật' : 'Đã tạo danh mục');
      setModalOpen(false); loadData();
    } catch (e) { if (e.message) message.error(e.message); }
  };

  const handleDelete = async (id) => {
    try { await CategoriesApi.delete(id); message.success('Đã xóa'); loadData(); }
    catch (e) { message.error(e.message); }
  };

  const handleToggle = async (id, cur) => {
    try { await CategoriesApi.setStatus(id, cur === 'active' ? 'inactive' : 'active'); message.success('Đã cập nhật'); loadData(); }
    catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Tên danh mục', dataIndex: 'name', render: v => <strong>{v}</strong> },
    { title: 'Mô tả', dataIndex: 'description', render: v => v || '—', ellipsis: true },
    { title: 'Trạng thái', dataIndex: 'status', render: v => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? 'Hoạt động' : 'Tạm dừng'}</Tag> },
    { title: 'Ngày tạo', dataIndex: 'created_at', render: v => v ? new Date(v).toLocaleDateString('vi-VN') : '—' },
    { title: 'Hành động', width: 180, render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Popconfirm title={`Xóa "${r.name}"?`} onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
          <Switch checked={(r.status || 'active') === 'active'} onChange={() => handleToggle(r.id, r.status || 'active')} size="small" />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card title={<span><AppstoreOutlined style={{ marginRight: 8 }} />Danh mục</span>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm mới</Button>}>
        <div className="filter-bar">
          <Input placeholder="Tìm theo tên, mô tả..." prefix={<SearchOutlined />} allowClear value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
          <Select placeholder="Tất cả trạng thái" allowClear value={statusFilter || undefined} onChange={v => setStatusFilter(v || '')} style={{ width: 160 }}
            options={[{ value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Tạm dừng' }]} />
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Hiển thị <strong>{filtered.length}</strong> / {data.length}</span>
        </div>
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 700 }} size="middle" />
      </Card>
      <Modal title={editing ? 'Sửa danh mục' : 'Thêm danh mục'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText={editing ? 'Lưu' : 'Tạo'} cancelText="Hủy">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Tên danh mục" name="name" rules={[{ required: true, message: 'Nhập tên' }]}><Input placeholder="Tên danh mục" /></Form.Item>
          <Form.Item label="Mô tả" name="description"><Input placeholder="Mô tả" /></Form.Item>
          
          <Form.Item label="Ảnh minh họa (URL)" name="image">
            <Input 
              placeholder="https://... hoặc tải ảnh ở dưới" 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUpload(e.target.files[0]);
                }
              }} 
              style={{ display: 'none' }}
              id="category-image-upload"
            />
            <label htmlFor="category-image-upload">
              <Button type="dashed" icon={uploading ? <LoadingOutlined /> : <PlusOutlined />} loading={uploading} onClick={() => document.getElementById('category-image-upload').click()}>
                {uploading ? 'Đang tải lên...' : 'Tải ảnh minh họa lên'}
              </Button>
            </label>
            {imageUrl && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <img src={imageUrl} alt="Category preview" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, border: '1px solid #E5E7EB', objectFit: 'contain' }} />
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </>
  );
}
