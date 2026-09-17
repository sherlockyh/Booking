# Booking — 会议室预订系统

前后端同仓（monorepo）：

- `meeting_room_booking_system_backend/`：NestJS 后端（MySQL + Redis）
- `meeting_room_booking_system_frontend_user/`：React + Vite 用户端（Nginx 托管并反代后端）

## 本地开发

```bash
# 首次：准备环境变量（参考 .env.example，填好 DB_PASSWORD / JWT_SECRET）
cp .env.example .env

# 启动全部服务（自动加载 docker-compose.override.yml，暴露 MySQL 3306 / Redis 6380）
docker compose up -d --build
```

前端访问 `http://localhost:8080`（端口见 compose 中 `FRONTEND_PORT`，默认 8080）。

热更新开发（数据库等仍由 compose 提供）：

```bash
cd meeting_room_booking_system_backend  && npm run start:dev
cd meeting_room_booking_system_frontend_user && npm run dev
```

## 服务器部署

首次：

```bash
git clone https://github.com/sherlockyh/Booking.git
cd Booking
cp .env.example .env && vim .env   # 强密码 + 随机 JWT_SECRET
./deploy.sh
```

日常更新（一条命令）：

```bash
./deploy.sh
```

`deploy.sh` 做两件事：`git pull --ff-only`，然后 `docker compose -f docker-compose.yml up -d --build`。
前后端镜像都在服务器本地构建，无需推送/拉取外部镜像仓库。
