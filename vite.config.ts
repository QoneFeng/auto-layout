import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig(({ command }) => ({
  // 统一服务用 /legacy/ 目录承载 Vue 版；dev 仍从根路径启动。
  base: command === 'build' ? '/legacy/' : '/',
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        legacy: path.resolve(process.cwd(), 'index.html'),
        admin: path.resolve(process.cwd(), 'admin.html'),
      },
    },
  },
  test: {
    // release/ 内含打包后的源码副本，不能再次作为测试文件收集，否则通过数会虚增。
    exclude: ['**/node_modules/**', '**/dist/**', '**/release/**'],
  },
}));
