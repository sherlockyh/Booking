import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 大体积第三方库拆成独立 chunk：业务代码迭代时不破坏这些库的长缓存。
        // 用函数形式按模块归类而不是对象形式，对象形式会把列出的包全量打入、
        // 禁用 tree-shaking（antd 会被打到 1MB+）
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }
          if (id.includes('echarts')) {
            return 'echarts';
          }
          if (
            id.includes('antd') ||
            id.includes('@ant-design') ||
            id.includes('rc-') ||
            id.includes('dayjs')
          ) {
            return 'antd';
          }
          if (id.includes('react')) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (currentPath) => currentPath.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
