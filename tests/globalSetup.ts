import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// 테스트 전용 SQLite DB를 스키마와 함께 생성한다.
export default function setup() {
  const root = path.resolve(__dirname, '..');
  const testDb = path.join(root, 'test.db');
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);

  execSync('npx prisma db push --skip-generate', {
    cwd: root,
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit',
  });
}
