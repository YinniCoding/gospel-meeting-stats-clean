# 活动统计系统

本地社区活动参与情况统计管理平台

## 功能特性

- 🏠 **小区管理**: 支持添加、编辑、删除小区和街道信息
- 📅 **聚会记录**: 完整的聚会记录管理，包括时间、地点、参与人数等
- 📸 **文件上传**: 支持图片和文档上传，丰富聚会记录内容
- 📊 **统计分析**: 丰富的图表展示，支持按时间、小区等维度统计
- 🔐 **用户认证**: 管理员登录系统，支持多用户管理
- 👤 **个人信息**: 支持修改姓名和密码，账户安全可控
- 📱 **响应式设计**: 支持网页和手机端自适应访问
- 🚀 **现代化界面**: 基于Ant Design的优雅用户界面

## 技术栈

### 后端
- Node.js + Express
- SQLite数据库
- JWT身份认证
- bcrypt密码加密

### 前端
- React 18
- Ant Design 5.x
- React Router 6
- Recharts图表库
- Axios HTTP客户端

## 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖

1. 安装后端依赖
```bash
npm install
```

2. 安装前端依赖
```bash
cd client
npm install
```

### 启动开发服务器

1. 启动后端服务器
```bash
npm run dev
```

2. 启动前端开发服务器
```bash
cd client
npm start
```

3. 访问应用
- 前端: http://localhost:3000
- 后端API: http://localhost:5000

### 生产构建

1. 构建前端
```bash
cd client
npm run build
```

2. 启动生产服务器
```bash
npm start
```

## 默认账户

系统会自动创建默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

**注意**: 生产环境请务必修改默认密码！

## 数据库结构

### 管理员表 (admins)
- id: 主键
- username: 用户名
- password: 加密密码
- name: 真实姓名
- role: 角色权限

### 小区表 (communities)
- id: 主键
- name: 小区/街道名称
- type: 类型 (street/community)
- district: 所属区域

### 聚会记录表 (meetings)
- id: 主键
- community_id: 小区ID
- meeting_date: 聚会日期
- meeting_time: 聚会时间
- location: 聚会地点
- participants_count: 参与人数
- notes: 备注信息
- created_by: 创建人ID

## API接口

### 认证相关
- `POST /api/login` - 用户登录

### 小区管理
- `GET /api/communities` - 获取小区列表
- `POST /api/communities` - 添加小区
- `PUT /api/communities/:id` - 更新小区
- `DELETE /api/communities/:id` - 删除小区

### 聚会记录
- `GET /api/meetings` - 获取聚会记录列表
- `POST /api/meetings` - 添加聚会记录
- `PUT /api/meetings/:id` - 更新聚会记录
- `DELETE /api/meetings/:id` - 删除聚会记录

### 统计分析
- `GET /api/statistics` - 获取统计数据

## 部署说明

### 本地部署
1. 克隆项目
2. 安装依赖
3. 启动服务器

### 服务器部署
1. 上传代码到服务器
2. 安装Node.js环境
3. 安装依赖并构建前端
4. 使用PM2等工具启动服务

### 免费托管部署
- **GitHub Pages**: 仅支持前端静态文件（详见 `DEPLOYMENT-GITHUB-PAGES.md`）
- **Vercel**: 支持全栈应用，推荐使用（详见 `vercel.json`）
- **Netlify**: 支持函数和数据库

### 环境变量
- `PORT`: 服务器端口 (默认: 5000)
- `JWT_SECRET`: JWT密钥 (生产环境必须设置)

## 功能截图

### 登录界面
现代化的登录界面，支持响应式设计

### 仪表板
数据概览和快速操作入口

### 聚会记录管理
完整的CRUD操作，支持搜索和分页

### 统计分析
多种图表展示，数据可视化

### 小区管理
小区和街道信息管理

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或联系开发团队。

---

**注意**: 本系统仅用于内部管理，请勿用于商业用途。
