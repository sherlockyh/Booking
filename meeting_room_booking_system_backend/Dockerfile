FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# 提前建好上传目录并归属给 node 用户，命名卷首次挂载时会继承该权限
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
