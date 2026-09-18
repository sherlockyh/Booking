import { registerAs } from '@nestjs/config';

// 日志级别缺省值：生产 http（可见请求/SQL，屏蔽 debug 明细），其余 debug（全量）
const defaultLevel = process.env.NODE_ENV === 'production' ? 'http' : 'debug';

export default registerAs('log', () => ({
  level: process.env.LOG_LEVEL ?? defaultLevel,
  // 相对启动目录：容器内是 /app/logs，本地开发是 backend/logs
  dir: process.env.LOG_DIR ?? 'logs',
  // 按天轮转文件的保留时长，支持 "14d" / "30d" 等
  maxFiles: process.env.LOG_MAX_FILES ?? '14d',
}));
