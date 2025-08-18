# 🚀 Vercel 部署指南

## 📋 部署前准备

### 1. 项目结构确认
确保您的项目包含以下文件：
- `server.js` - 后端服务器
- `client/` - React 前端应用
- `vercel.json` - Vercel 配置文件
- `package.json` - 项目依赖配置

### 2. 代码提交
```bash
git add .
git commit -m "准备部署到 Vercel"
```

## 🌐 网页界面部署（推荐）

### 步骤 1：访问 Vercel
1. 打开浏览器，访问：https://vercel.com
2. 点击右上角的 "Sign Up" 或 "Log In"
3. 选择 "Continue with GitHub"（推荐）

### 步骤 2：创建新项目
1. 登录成功后，点击 "New Project"
2. 选择 "Import Git Repository"
3. 选择您的 GitHub 仓库

### 步骤 3：配置项目
在项目配置页面，设置以下参数：

**Project Name**: `activity-stats`（或您喜欢的名称）

**Framework Preset**: 选择 "Other"

**Root Directory**: 保持默认（根目录）

**Build Command**: 
```bash
cd client && npm install && npm run build
```

**Output Directory**: 
```
client/build
```

**Install Command**: 
```bash
npm install
```

### 步骤 4：环境变量配置
在 "Environment Variables" 部分添加：
```
NODE_ENV=production
PORT=3001
```

### 步骤 5：部署
点击 "Deploy" 按钮，等待部署完成！

## 🔧 命令行部署（备选方案）

如果网页界面部署遇到问题，可以尝试命令行：

### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 部署项目
```bash
vercel
```

## 📱 部署后配置

### 1. 获取部署 URL
部署成功后，Vercel 会提供：
- 生产环境 URL（如：https://your-project.vercel.app）
- 预览环境 URL

### 2. 测试应用
1. 访问部署的 URL
2. 使用默认账户登录：
   - 用户名：`admin`
   - 密码：`admin123`

### 3. 自定义域名（可选）
在 Vercel 控制台中：
1. 进入项目设置
2. 选择 "Domains"
3. 添加您的自定义域名

## 🚨 常见问题解决

### 问题 1：构建失败
**解决方案**：
- 检查 `package.json` 中的依赖版本
- 确保 Node.js 版本兼容（推荐 16.x 或更高）
- 查看构建日志中的具体错误信息

### 问题 2：API 调用失败
**解决方案**：
- 确认 `vercel.json` 中的路由配置正确
- 检查环境变量设置
- 验证 API 端点路径

### 问题 3：静态文件无法访问
**解决方案**：
- 确认 `Output Directory` 设置为 `client/build`
- 检查构建命令是否正确执行
- 验证文件路径配置

## 📊 性能优化建议

### 1. 图片优化
- 使用 WebP 格式
- 实现懒加载
- 压缩图片文件

### 2. 代码分割
- 启用 React 的代码分割
- 使用动态导入
- 优化包大小

### 3. 缓存策略
- 设置适当的缓存头
- 使用 CDN 加速
- 实现服务工作者缓存

## 🔒 安全配置

### 1. 环境变量
- 敏感信息使用环境变量
- 不要在前端代码中暴露 API 密钥
- 定期轮换密钥

### 2. HTTPS
- Vercel 自动提供 HTTPS
- 启用 HSTS 头
- 配置安全策略

## 📈 监控和分析

### 1. Vercel Analytics
- 启用内置分析
- 监控页面性能
- 跟踪用户行为

### 2. 错误监控
- 集成错误跟踪服务
- 设置告警机制
- 定期检查日志

## 🎯 下一步

部署成功后，您可以：
1. 分享应用链接给团队成员
2. 配置自定义域名
3. 设置自动部署
4. 监控应用性能
5. 收集用户反馈

---

## 📞 技术支持

如果遇到部署问题：
1. 查看 Vercel 官方文档：https://vercel.com/docs
2. 检查项目构建日志
3. 在 Vercel 社区寻求帮助
4. 联系技术支持

祝您部署顺利！🎉
