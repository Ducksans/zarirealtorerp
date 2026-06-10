import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // [Phase 0] 품질 게이트 재가동:
  // 과거 프로토타이핑 단계에서 꺼두었던 빌드 타입체크를 복원함 (c7b4537 롤백).
  // 타입 오류가 있으면 빌드가 실패해야 한다 — 할루시네이션 차단 게이트.
};

export default nextConfig;
