import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Typography, 
  Alert,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  SaveOutlined, 
  KeyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;
const { Password } = Input;

const Profile = () => {
  const { logout } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetchUserInfo();
  }); 

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/api/profile');
      setUserInfo(response.data);
      form.setFieldsValue({
        name: response.data.name,
        username: response.data.username
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      message.error('获取用户信息失败');
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      await api.put('/api/profile', values);
      message.success('个人信息更新成功');
      fetchUserInfo(); // 重新获取用户信息
    } catch (error) {
      console.error('更新失败:', error);
      message.error(error.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    try {
      setPasswordLoading(true);
      await api.put('/api/profile/password', values);
      message.success('密码修改成功，请重新登录');
      // 清除本地存储并跳转到登录页
      logout();
    } catch (error) {
      console.error('密码修改失败:', error);
      message.error(error.response?.data?.error || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>个人信息管理</Title>
        <Text type="secondary">管理您的账户信息和密码</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* 基本信息 */}
        <Col xs={24} lg={12}>
          <Card title="基本信息" icon={<UserOutlined />}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={{
                name: userInfo?.name || '',
                username: userInfo?.username || ''
              }}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名！' },
                  { min: 3, message: '用户名至少3个字符！' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名"
                  disabled
                />
              </Form.Item>

              <Form.Item
                name="name"
                label="真实姓名"
                rules={[
                  { required: true, message: '请输入真实姓名！' },
                  { max: 50, message: '姓名不能超过50个字符！' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="真实姓名"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  block
                >
                  更新个人信息
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 修改密码 */}
        <Col xs={24} lg={12}>
          <Card title="修改密码" icon={<LockOutlined />}>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[
                  { required: true, message: '请输入当前密码！' },
                  { min: 6, message: '密码至少6个字符！' }
                ]}
              >
                <Password 
                  prefix={<LockOutlined />} 
                  placeholder="当前密码"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码！' },
                  { min: 6, message: '密码至少6个字符！' },
                  { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字！' }
                ]}
              >
                <Password 
                  prefix={<KeyOutlined />} 
                  placeholder="新密码"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码！' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致！'));
                    },
                  }),
                ]}
              >
                <Password 
                  prefix={<KeyOutlined />} 
                  placeholder="确认新密码"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                  icon={<KeyOutlined />}
                  block
                  danger
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* 账户信息 */}
      <Card title="账户信息" style={{ marginTop: 24 }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>用户ID:</Text>
              <div style={{ marginTop: 8, color: '#666' }}>{userInfo?.id}</div>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>用户名:</Text>
              <div style={{ marginTop: 8, color: '#666' }}>{userInfo?.username}</div>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>真实姓名:</Text>
              <div style={{ marginTop: 8, color: '#666' }}>{userInfo?.name}</div>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>角色权限:</Text>
              <div style={{ marginTop: 8, color: '#666' }}>
                {userInfo?.role === 'super_admin' ? '超级管理员' : '管理员'}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>创建时间:</Text>
              <div style={{ marginTop: 8, color: '#666' }}>
                {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleString('zh-CN') : '-'}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 安全提示 */}
      <Alert
        message="安全提示"
        description={
          <div>
            <p>• 密码修改成功后，系统将自动退出登录，请使用新密码重新登录</p>
            <p>• 建议使用包含字母、数字和特殊字符的强密码</p>
            <p>• 请妥善保管您的账户信息，不要与他人分享</p>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginTop: 24 }}
      />
    </div>
  );
};

export default Profile;
