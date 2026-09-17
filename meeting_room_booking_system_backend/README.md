# 会议室预订系统 - 后端

基于 NestJS 12 + TypeORM + MySQL + Redis 的会议室预订系统后端服务。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| NestJS | 12 | 后端框架 |
| TypeORM | 1.x | ORM 框架，支持迁移 |
| MySQL | 8.4 | 关系型数据库 |
| Redis | 7.4 | 缓存 + 验证码存储 |
| JWT | - | 用户认证（双 Token 机制） |
| bcrypt | - | 密码哈希 |
| Swagger | - | API 文档 |

## 项目结构

```
src/
├── common/                # 公共模块
│   ├── decorators/        # 自定义装饰器（@RequireLogin, @RequireAdmin, @UserInfo）
│   ├── filter/            # 异常过滤器（未登录、自定义异常）
│   ├── guard/             # 认证守卫（LoginGuard, PermissionGuard）
│   ├── interceptor/       # 拦截器（统一响应格式、调用记录）
│   └── utils/             # 工具函数（密码哈希、ParseIntPipe 等）
├── infrastructure/        # 基础设施
│   ├── config/            # 配置加载（app, database, redis, jwt）
│   ├── database/migrations/ # 数据库迁移
│   ├── jwt/               # JWT 模块
│   └── redis/             # Redis 模块
├── modules/               # 业务模块
│   ├── user/              # 用户模块（注册、登录、信息管理）
│   ├── meeting-room/      # 会议室模块（增删改查）
│   ├── booking/           # 预订模块（申请、审批、解除）
│   └── statistic/         # 统计模块（用户预订数、会议室使用数）
├── app.module.ts          # 根模块
└── main.ts                # 入口文件
```

## 快速开始

### 1. 环境准备

需要安装 Node.js (>= 20)、Docker。

### 2. 启动 MySQL 和 Redis

```bash
# 启动 MySQL 和 Redis 容器
npm run compose:up

# 查看日志
npm run compose:logs

# 停止
npm run compose:down
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 按需修改端口、数据库连接等配置
```

默认配置：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3000 | 服务端口 |
| DB_HOST | 127.0.0.1 | MySQL 地址 |
| DB_PORT | 3306 | MySQL 端口 |
| DB_USERNAME | root | MySQL 用户名 |
| DB_PASSWORD | huihui | MySQL 密码 |
| DB_DATABASE | meeting_room_booking_system | 数据库名 |
| REDIS_HOST | 127.0.0.1 | Redis 地址 |
| REDIS_PORT | 6380 | Redis 端口（映射到容器内 6379） |

### 4. 安装依赖并启动

```bash
npm install

# 开发模式（热重载）
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

服务启动后，数据库迁移会自动执行，包括创建初始账号。

### 5. API 文档

启动后访问 Swagger 文档：`http://localhost:3000/api-doc`

## 默认账号

迁移执行后会自动创建以下账号（密码使用 bcrypt 哈希）：

| 角色 | 用户名 | 密码 | 登录入口 |
|------|--------|------|----------|
| 管理员 | admin | admin123 | POST /user/admin/login |
| 普通用户 | user | user123 | POST /user/login |

## API 接口概览

### 用户模块 `/user`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /user/captcha | - | 获取注册验证码 |
| POST | /user/register | - | 用户注册 |
| POST | /user/login | - | 用户登录 |
| POST | /user/admin/login | - | 管理员登录 |
| GET | /user/refresh | - | 刷新用户 Token |
| GET | /user/admin/refresh | - | 刷新管理员 Token |
| GET | /user/info | @RequireLogin | 获取当前用户信息 |
| POST | /user/update | @RequireLogin | 更新用户信息 |
| POST | /user/update_password | @RequireLogin | 修改密码 |
| GET | /user/update/captcha | @RequireLogin | 获取更新验证码 |
| POST | /user/upload | @RequireLogin | 上传头像 |
| GET | /user/list | @RequireAdmin | 用户列表（分页） |
| GET | /user/freeze | @RequireAdmin | 冻结用户 |
| GET | /user/unfreeze | @RequireAdmin | 解冻用户 |
| POST | /user/admin/reset_password | @RequireAdmin | 重置用户密码 |
| POST | /user/admin/delete | @RequireAdmin | 删除用户 |

### 会议室模块 `/meeting-room`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /meeting-room/list | - | 会议室列表（分页） |
| POST | /meeting-room/create | @RequireAdmin | 新建会议室 |
| PUT | /meeting-room/update | @RequireAdmin | 编辑会议室 |
| GET | /meeting-room/:id | - | 会议室详情 |
| DELETE | /meeting-room/:id | @RequireAdmin | 删除会议室 |

### 预订模块 `/booking`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /booking/list | - | 预订列表（分页） |
| POST | /booking/add | @RequireLogin | 创建预订 |
| GET | /booking/apply/:id | @RequireAdmin | 审批通过 |
| GET | /booking/reject/:id | @RequireAdmin | 审批驳回 |
| GET | /booking/unbind/:id | @RequireAdmin | 解除预订 |

### 统计模块 `/statistic`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /statistic/userBookingCount | - | 用户预订次数统计 |
| GET | /statistic/meetingRoomUsedCount | - | 会议室使用次数统计 |

## 数据库迁移

迁移在服务启动时自动执行（`migrationsRun: true`）。

| 迁移文件 | 说明 |
|----------|------|
| 1756810000000-initial-schema | 初始表结构（users, roles, permissions 等） |
| 1757510000000-add-meeting-room | 会议室表 |
| 1757520000000-add-booking | 预订表 |
| 1757600000000-alter-password-length | 扩大 password 列至 varchar(255) |
| 1757700000000-seed-fresh-accounts | 清空旧账号，创建管理员和普通用户 |

## 测试

```bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e
```

## License

MIT
