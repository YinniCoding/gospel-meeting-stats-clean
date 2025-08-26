import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  DatePicker, 
  Button, 
  Table, 
  Typography, 
  Statistic, 
  Spin,
  Space,
  Select,
  message
} from 'antd';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  ReloadOutlined, 
  CalendarOutlined, 
  TeamOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Statistics = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [selectedCommunity, setSelectedCommunity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [communities, setCommunities] = useState([]);
  const [groupBy, setGroupBy] = useState('project'); // project | unit | project_unit

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [dateRange, selectedCommunity, selectedType, groupBy]);

  const fetchCommunities = async () => {
    try {
      const response = await api.get('/api/communities');
      setCommunities(response.data);
    } catch (error) {
      console.error('获取小区列表失败:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      params.groupBy = groupBy;
      const response = await api.get('/api/statistics', { params });
      setStatistics(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const handleCommunityChange = (value) => {
    setSelectedCommunity(value);
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
  };

  const handleRefresh = () => {
    fetchStatistics();
  };

  const exportToCSV = () => {
    if (!statistics.length) {
      message.warning('暂无数据可导出');
      return;
    }
    const headers = [
      '项目', '名称', '类型', '聚会次数', '总参与人数', '平均参与人数'
    ];
    const rows = statistics.map(item => [
      item.project,
      item.community_name,
      typeLabels[item.community_type],
      item.meeting_count || 0,
      item.total_participants || 0,
      Math.round(item.avg_participants || 0)
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `statistics_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
  };

  // 计算总体统计数据
  const totalStats = {
    totalMeetings: statistics.reduce((sum, item) => sum + (item.meeting_count || 0), 0),
    totalParticipants: statistics.reduce((sum, item) => sum + (item.total_participants || 0), 0),
    totalCommunities: statistics.length,
    avgParticipants: statistics.reduce((sum, item) => sum + (item.avg_participants || 0), 0) / Math.max(statistics.length, 1)
  };

  // 准备图表数据
  const getName = (item) => {
    if (groupBy === 'project') return `项目 ${item.project}`;
    if (groupBy === 'project_unit') return `${item.project} - ${item.community_name}`;
    return item.community_name;
  };

  const chartData = statistics
    .filter(item => 
      (selectedCommunity === 'all' || item.community_name === selectedCommunity) &&
      (selectedType === 'all' || item.community_type === selectedType)
    )
    .map(item => ({
      name: getName(item),
      meetings: item.meeting_count || 0,
      participants: item.total_participants || 0,
      avgParticipants: Math.round(item.avg_participants || 0)
    }))
    .sort((a, b) => b.meetings - a.meetings);

  const pieData = chartData.map(item => ({
    name: item.name,
    value: item.meetings
  }));


  const colors = ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2', '#f5222d', '#fa541c'];

  const typeLabels = {
    group: '组',
    pai: '排',
    community: '小区',
    region: '大区',
    church: '召会',
  };

  const columns = [
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 100,
    },
    {
      title: '类型',
      dataIndex: 'community_type',
      key: 'community_type',
      width: 120,
      fixed: 'left',
      render: (type) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{typeLabels[type]}</span>
    },
    {
      title: '聚会次数',
      dataIndex: 'meeting_count',
      key: 'meeting_count',
      width: 100,
      render: (count) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{count || 0}</span>
    },
    {
      title: '总参与人数',
      dataIndex: 'total_participants',
      key: 'total_participants',
      width: 120,
      render: (count) => <span style={{ fontWeight: 'bold', color: '#52c41a' }}>{count || 0}</span>
    },
    {
      title: '平均参与人数',
      dataIndex: 'avg_participants',
      key: 'avg_participants',
      width: 120,
      render: (avg) => <span style={{ fontWeight: 'bold', color: '#722ed1' }}>{Math.round(avg || 0)}</span>
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载统计数据中...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>统计分析</Title>
      </div>

      {/* 筛选条件 */}
      <Card size="small" style={{ marginBottom: 24 }}>
        <Space size="middle" wrap>
          <span>日期范围：</span>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            placeholder={['开始日期', '结束日期']}
          />
          <span>统计维度：</span>
          <Select value={groupBy} onChange={setGroupBy} style={{ width: 220 }}>
            <Option value="project">按项目</Option>
            <Option value="unit">按组/排/小区/大区/召会</Option>
            <Option value="project_unit">按 项目+组/排/小区/大区/召会</Option>
          </Select>
          <span>类型：</span>
          <Select
            value={selectedType}
            onChange={handleTypeChange}
            style={{ width: 150 }}
            placeholder="选择类型"
            allowClear
          >
            <Option value="all">全部</Option>
            <Option value="group">组</Option>
            <Option value="pai">排</Option>
            <Option value="community">小区</Option>
            <Option value="region">大区</Option>
            <Option value="church">召会</Option>
          </Select>
          <span>具体单位：</span>
          <Select
            value={selectedCommunity}
            onChange={handleCommunityChange}
            style={{ width: 200 }}
            placeholder="选择具体单位"
            allowClear
          >
            <Option value="all">全部</Option>
            {communities
              .filter(community => selectedType === 'all' || community.type === selectedType)
              .map(community => (
                <Option key={community.id} value={community.name}>
                  {community.name}
                </Option>
              ))}
          </Select>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
          >
            刷新数据
          </Button>
          <Button onClick={exportToCSV}>
            导出CSV
          </Button>
        </Space>
      </Card>

      {/* 总体统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="总聚会次数"
              value={totalStats.totalMeetings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="总参与人数"
              value={totalStats.totalParticipants}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="管理小区数"
              value={totalStats.totalCommunities}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="平均参与人数"
              value={Math.round(totalStats.avgParticipants)}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="聚会次数统计" size="small" className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="meetings" fill="#1890ff" name="聚会次数" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="参与人数统计" size="small" className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="participants" fill="#52c41a" name="参与人数" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="聚会次数分布" size="small" className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="平均参与人数趋势" size="small" className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgParticipants" 
                  stroke="#fa8c16" 
                  name="平均参与人数"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 详细数据表格 */}
      <Card title="详细统计数据" size="small">
        <Table
          columns={columns}
          dataSource={statistics}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
          size="small"
          bordered
        />
      </Card>
    </div>
  );
};

export default Statistics;
