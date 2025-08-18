import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Typography, Space } from 'antd';
import { 
  HomeOutlined, 
  CalendarOutlined, 
  BarChartOutlined, 
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/meetings',
      icon: <CalendarOutlined />,
      label: '聚会记录',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '统计分析',
    },
    {
      key: '/communities',
      icon: <TeamOutlined />,
      label: '小区管理',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return ['/'];
    if (path.startsWith('/meetings')) return ['/meetings'];
    return [path];
  };

  return (
    <AntHeader style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 24px',
      background: '#001529'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            fontSize: '16px',
            width: 64,
            height: 64,
            color: 'white',
            marginRight: 16
          }}
        />
        
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
          活动统计系统
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={getSelectedKey()}
          onClick={handleMenuClick}
          items={menuItems}
          style={{ 
            flex: 1, 
            minWidth: 0,
            background: 'transparent',
            border: 'none'
          }}
        />

        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow
        >
          <Space style={{ color: 'white', cursor: 'pointer', marginLeft: 24 }}>
            <Avatar icon={<UserOutlined />} size="small" />
            <Text style={{ color: 'white' }}>{user?.name || user?.username}</Text>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;
