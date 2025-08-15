import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MeetingList from './components/MeetingList';
import MeetingForm from './components/MeetingForm';
import Statistics from './components/Statistics';
import CommunityManagement from './components/CommunityManagement';
import Profile from './components/Profile';
import Header from './components/Header';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

const { Content } = Layout;

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// 主应用组件
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Header />
      <Content className="ant-layout-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/meetings" element={<MeetingList />} />
          <Route path="/meetings/add" element={<MeetingForm />} />
          <Route path="/meetings/edit/:id" element={<MeetingForm />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/communities" element={<CommunityManagement />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
    </Layout>
  );
};

// 根应用组件
const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
