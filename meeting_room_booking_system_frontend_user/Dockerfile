# 构建阶段：生成 Vite 生产包
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 运行阶段：Nginx 托管静态资源并反代后端
FROM nginx:stable-alpine3.24-perl

RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai
ENV BACKEND_HOST=nest-app \
    BACKEND_PORT=3000

COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -q --spider http://127.0.0.1/healthz || exit 1
