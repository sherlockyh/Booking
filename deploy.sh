#!/usr/bin/env bash
# 服务器部署脚本：拉取最新代码并本地构建启动
# 显式 -f docker-compose.yml，跳过本地开发用的 override（不暴露数据库端口）
set -euo pipefail
cd "$(dirname "$0")"

echo ">>> git pull"
git pull --ff-only

echo ">>> docker compose build & up"
docker compose -f docker-compose.yml up -d --build
