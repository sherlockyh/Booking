# 会议室预订系统 - 前端

基于 React 18 + TypeScript + Vite + Ant Design 的会议室预订系统前端，包含用户端和管理后台两套界面。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18 | UI 框架 |
| TypeScript | 5.6 | 类型安全 |
| Vite | 6 | 构建工具 |
| Ant Design | 5 | UI 组件库 |
| React Router | 6 | 路由 |
| ECharts | 6 | 数据可视化 |
| Axios | 1.7 | HTTP 请求 |
| dayjs | 1.11 | 日期处理 |

## 项目结构

```
src/
├── app/                   # 应用入口
│   ├── App.tsx            # 根组件
│   ├── providers.tsx      # 全局 Provider
│   └── router.tsx         # 路由配置
├── layouts/               # 布局组件
│   ├── AuthLayout/        # 登录注册布局
│   ├── UserLayout/        # 用户端布局（侧边栏 + 顶栏）
│   └── AdminLayout/       # 管理端布局（侧边栏 + 顶栏）
├── modules/               # 业务页面
│   ├── admin/             # 管理端
│   │   ├── login/         # 管理员登录
│   │   ├── users/         # 用户管理
│   │   ├── meetingRooms/  # 会议室管理
│   │   ├── bookings/      # 预订管理
│   │   ├── statistics/    # 数据统计
│   │   ├── profile/       # 管理员信息
│   │   ├── password/      # 修改密码
│   │   ├── api.ts         # 管理端 API
│   │   ├── store.ts       # 管理端状态
│   │   └── types.ts       # 管理端类型
│   └── user/              # 用户端
│       ├── auth/          # 登录 / 注册
│       ├── meetingRooms/  # 会议室列表
│       ├── bookings/      # 预订历史
│       ├── statistics/    # 数据统计
│       ├── profile/       # 个人信息
│       ├── password/      # 修改密码
│       ├── api.ts         # 用户端 API
│       ├── store.ts       # 用户端状态
│       └── types.ts       # 用户端类型
├── shared/                # 共享模块
│   ├── api/               # 请求封装（双 Axios 实例 + Token 刷新）
│   ├── components/        # 通用组件（ConfigTable, ConfigFilterForm, PageHeader, StatisticsPage 等）
│   ├── constants/         # 常量（路由路径、Storage Key）
│   ├── hooks/             # 自定义 Hooks（useRequest, usePageRequest）
│   └── utils/             # 工具函数
├── styles/                # 全局样式
└── main.tsx               # 入口文件
```

## 快速开始

### 1. 环境准备

需要安装 Node.js (>= 20)，并先启动后端服务。

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

前端运行在 `http://localhost:5173`，API 请求通过 Vite 代理转发到后端 `http://localhost:3000`。

### 4. 构建生产包

```bash
npm run build
npm run preview
```

## 默认账号

| 角色 | 用户名 | 密码 | 登录入口 |
|------|--------|------|----------|
| 管理员 | admin | admin123 | http://localhost:5173/admin/login |
| 普通用户 | user | user123 | http://localhost:5173/login |

## 功能模块

### 用户端

| 页面 | 路由 | 说明 |
|------|------|------|
| 登录 | /login | 用户登录 |
| 注册 | /register | 用户注册 |
| 会议室列表 | /meeting-rooms | 浏览并预订会议室 |
| 预订历史 | /bookings | 查看预订记录，可解除 |
| 数据统计 | /statistics | 用户预订 + 会议室使用统计 |
| 个人信息 | /profile | 修改昵称、头像 |
| 修改密码 | /password | 修改密码 |

### 管理端

| 页面 | 路由 | 说明 |
|------|------|------|
| 管理员登录 | /admin/login | 管理员登录 |
| 用户管理 | /admin/users | 冻结/解冻、重置密码、删除 |
| 会议室管理 | /admin/meeting-rooms | 新增/编辑/删除会议室 |
| 预订管理 | /admin/bookings | 审批/驳回/解除预订 |
| 数据统计 | /admin/statistics | 全局预订 + 会议室使用统计 |
| 管理员信息 | /admin/profile | 修改管理员信息 |
| 修改密码 | /admin/password | 修改管理员密码 |

## Vite 代理配置

开发环境下通过 `vite.config.js` 配置代理：

- `/api` → `http://localhost:3000`（API 请求，去掉 `/api` 前缀）
- `/uploads` → `http://localhost:3000`（静态文件，如头像图片）

## 技术要点

### 双 Token 认证

用户端和管理端使用独立的 Token 存储（localStorage），各自维护 access_token 和 refresh_token。Token 过期时自动刷新并重试请求。

### 自定义 Hooks

- `useRequest`：通用请求 Hook，管理 loading/data 状态
- `usePageRequest`：分页请求 Hook，管理分页参数 + 搜索条件 + 列表数据

### 通用组件

- `ConfigTable`：封装 Ant Design Table，统一分页配置
- `ConfigFilterForm`：配置式筛选表单
- `PageHeader`：页面标题栏
- `StatisticsPage`：统计页面共享组件（ECharts 图表 + 日期筛选）
