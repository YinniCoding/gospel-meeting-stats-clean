import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Form, 
  Input, 
  Select, 
  Modal, 
  message, 
  Space, 
  Tag,
  Typography,
  Popconfirm,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  TeamOutlined,
  EnvironmentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

// 类型映射
const typeLabels = {
  group: '组',
  pai: '排',
  community: '小区',
  region: '大区',
  church: '召会',
};

const CommunityManagement = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/communities');
      setCommunities(response.data);
    } catch (error) {
      console.error('获取小区列表失败:', error);
      message.error('获取小区列表失败');
    } finally {
      setLoading(false);
    }
  };

  const showAddModal = () => {
    setEditingCommunity(null);
    form.resetFields();
    setModalVisible(true);
  };

  const showEditModal = (community) => {
    setEditingCommunity(community);
    form.setFieldsValue({
      name: community.name,
      type: community.type,
      project: community.project
    });
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingCommunity) {
        // 编辑模式
        await api.put(`/api/communities/${editingCommunity.id}`, values);
        message.success('小区信息更新成功');
      } else {
        // 添加模式
        await api.post('/api/communities', values);
        message.success('小区添加成功');
      }
      
      setModalVisible(false);
      fetchCommunities();
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      console.error('保存失败:', error);
      message.error(error.response?.data?.error || '保存失败');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingCommunity(null);
    form.resetFields();
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/communities/${id}`);
      message.success('删除成功');
      fetchCommunities();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 120,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {text}
          </div>
          <Tag color="#1890ff">{typeLabels[record.type]}</Tag>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => <Tag color="#1890ff">{typeLabels[type]}</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (text) => new Date(text).toLocaleDateString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
              编辑
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定要删除这个记录吗？"
            description="删除后相关的聚会记录将无法显示，请谨慎操作！"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            okType="danger"
          >
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>项目管理</Title>
      </div>

      {/* 操作按钮 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            添加项目
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchCommunities}
          >
            刷新
          </Button>
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card size="small">
        <Table
          columns={columns}
          dataSource={communities}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            defaultPageSize: 20,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 800 }}
          size="small"
          bordered
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingCommunity ? '编辑项目' : '添加项目'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="保存"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="project"
            label="项目"
            rules={[{ required: true, message: '请选择项目！' }]}
          >
            <Select placeholder="选择项目（1~10）">
              {Array.from({ length: 10 }, (_, i) => `${i + 1}`).map(p => (
                <Option key={p} value={p}>{p}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型！' }]}
          >
            <Select placeholder="选择类型">
              <Option value="group">组</Option>
              <Option value="pai">排</Option>
              <Option value="community">小区</Option>
              <Option value="region">大区</Option>
              <Option value="church">召会</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称！' }, { max: 100, message: '名称不能超过100个字符！' }]}
          >
            <Input placeholder="输入组/排/小区/大区/召会名称" maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommunityManagement;
