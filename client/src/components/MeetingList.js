import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Popconfirm, 
  message, 
  Tag,
  Row,
  Col,
  Typography
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const typeLabels = {
  group: '组',
  pai: '排',
  community: '小区',
  region: '大区',
  church: '召会',
};

const MeetingList = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
  });
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async (page = 1, pageSize = 20, filters = {}) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        ...filters
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD');
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD');
        delete params.dateRange;
      }

      const response = await api.get('/api/meetings', { params });
      setMeetings(response.data.meetings);
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize,
        total: response.data.pagination.total_records
      }));
    } catch (error) {
      console.error('获取聚会记录失败:', error);
      message.error('获取聚会记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    const filters = { ...values };
    if (filters.dateRange && filters.dateRange.length === 2) {
      filters.start_date = filters.dateRange[0].format('YYYY-MM-DD');
      filters.end_date = filters.dateRange[1].format('YYYY-MM-DD');
      delete filters.dateRange;
    }
    
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    fetchMeetings(1, pagination.pageSize, filters);
  };

  const handleReset = () => {
    searchForm.resetFields();
    fetchMeetings(1, pagination.pageSize, {});
  };

  const handleTableChange = (paginationInfo, filters, sorter) => {
    const currentFilters = searchForm.getFieldsValue();
    fetchMeetings(paginationInfo.current, paginationInfo.pageSize, currentFilters);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/meetings/${id}`);
      message.success('删除成功');
      fetchMeetings(pagination.current, pagination.pageSize, searchForm.getFieldsValue());
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const exportToCSV = () => {
    if (!meetings.length) {
      message.warning('暂无数据可导出');
      return;
    }
    const headers = [
      '项目', '名称', '类型', '聚会日期', '聚会时间', '地点', '参与人数', '备注', '创建人', '创建时间'
    ];
    const rows = meetings.map(item => [
      item.project,
      item.community_name,
      typeLabels[item.community_type],
      dayjs(item.meeting_date).format('YYYY-MM-DD'),
      item.meeting_time,
      item.location,
      item.participants_count,
      item.notes || '',
      item.created_by_name,
      dayjs(item.created_at).format('YYYY-MM-DD HH:mm')
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `meetings_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
  };

  const columns = [
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 60,
    },
    {
      title: '类型',
      dataIndex: 'community_type',
      key: 'community_type',
      width: 80,
      render: (type) => <Tag color="#1890ff">{typeLabels[type]}</Tag>
    },
    {
      title: '参与人数',
      dataIndex: 'participants_count',
      key: 'participants_count',
      width: 90,
      render: (text) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{text}</span>
    },
    {
      title: '聚会日期',
      dataIndex: 'meeting_date',
      key: 'meeting_date',
      width: 100,
      render: (text) => dayjs(text).format('MM-DD')
    },
    {
      title: '聚会时间',
      dataIndex: 'meeting_time',
      key: 'meeting_time',
      width: 80
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      ellipsis: true
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      ellipsis: true
    },
    {
      title: '创建人',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      width: 80
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (text) => dayjs(text).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/meetings/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>聚会记录管理</Title>
      </div>

      {/* 搜索表单 */}
      <Card className="search-form" size="small">
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="project" label="项目">
                <Select
                  placeholder="选择项目"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {Array.from({ length: 10 }, (_, i) => `${i + 1}`).map(p => (
                    <Option key={p} value={p}>{p}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="community_type" label="组/排/小区/大区/召会">
                <Select
                  placeholder="选择类型"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  <Option value="group">组</Option>
                  <Option value="pai">排</Option>
                  <Option value="community">小区</Option>
                  <Option value="region">大区</Option>
                  <Option value="church">召会</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="dateRange" label="日期范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item name="location" label="地点">
                <Input placeholder="输入地点关键词" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    搜索
                  </Button>
                  <Button onClick={handleReset} icon={<ReloadOutlined />}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/meetings/add')}
          >
            添加聚会记录
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchMeetings(pagination.current, pagination.pageSize, searchForm.getFieldsValue())}
          >
            刷新
          </Button>
          <Button
            onClick={exportToCSV}
          >
            导出CSV
          </Button>
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card size="small">
        <Table
          columns={columns}
          dataSource={meetings}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
          bordered
        />
      </Card>
    </div>
  );
};

export default MeetingList;
