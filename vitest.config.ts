import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // 테스트 전용 SQLite DB (dev.db 오염 방지)
    env: {
      DATABASE_URL: 'file:./test.db',
    },
    globalSetup: './tests/globalSetup.ts',
    testTimeout: 30000,
    // 정산 시나리오는 동일 DB를 공유하므로 직렬 실행
    fileParallelism: false,
  },
});
