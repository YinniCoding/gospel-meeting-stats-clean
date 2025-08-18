import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, Typography, Spin } from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  BarChartOutlined,
  UserOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMeetings: 0,
    totalParticipants: 0,
    totalCommunities: 0,
    recentMeetings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取统计数据
      const statsResponse = await api.get('/api/statistics');
      const communitiesResponse = await api.get('/api/communities');
      const meetingsResponse = await api.get('/api/meetings?limit=5');
      
      const totalParticipants = statsResponse.data.reduce((sum, item) => sum + (item.total_participants || 0), 0);
      const totalMeetings = statsResponse.data.reduce((sum, item) => sum + (item.meeting_count || 0), 0);
      
      setStats({
        totalMeetings,
        totalParticipants,
        totalCommunities: communitiesResponse.data.length,
        recentMeetings: meetingsResponse.data.meetings || []
      });
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: '添加聚会记录',
      icon: <PlusOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/meetings/add'),
      description: '记录新的社区活动'
    },
    {
      title: '查看统计',
      icon: <BarChartOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/statistics'),
      description: '查看详细统计数据'
    },
    {
      title: '管理小区',
      icon: <TeamOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/communities'),
      description: '管理小区和街道信息'
    },
    {
      title: '聚会列表',
      icon: <CalendarOutlined />,
      color: '#fa8c16',
      onClick: () => navigate('/meetings'),
      description: '查看所有聚会记录'
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>欢迎使用活动统计系统</Title>
        <Text type="secondary">
          本地社区活动参与情况统计管理平台
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="总聚会次数"
              value={stats.totalMeetings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="总参与人数"
              value={stats.totalParticipants}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="管理小区数"
              value={stats.totalCommunities}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stats-card">
            <Statistic
              title="平均参与人数"
              value={stats.totalMeetings > 0 ? Math.round(stats.totalParticipants / stats.totalMeetings) : 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="快速操作" size="small">
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                  <Card
                    hoverable
                    size="small"
                    onClick={action.onClick}
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '32px', color: action.color, marginBottom: 8 }}>
                      {action.icon}
                    </div>
                    <Title level={5} style={{ margin: '8px 0' }}>
                      {action.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {action.description}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 最近聚会记录 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title="最近聚会记录" 
            size="small"
            extra={
              <Button type="link" onClick={() => navigate('/meetings')}>
                查看全部
              </Button>
            }
          >
            {stats.recentMeetings.length > 0 ? (
              <div>
                {stats.recentMeetings.map((meeting, index) => (
                  <div
                    key={meeting.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < stats.recentMeetings.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                        {meeting.community_name}
                      </div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        <EnvironmentOutlined /> {meeting.location}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                        {dayjs(meeting.meeting_date).format('MM-DD')} {meeting.meeting_time}
                      </div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        参与人数: {meeting.participants_count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                暂无聚会记录
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
