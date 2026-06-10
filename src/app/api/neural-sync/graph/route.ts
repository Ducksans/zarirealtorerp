/*---
id: route.ts
milestone: M0
why: API 라우트 엔드포인트 (route.ts)
backlinks: [[[API_Routes]]]
---*/

import { NextResponse } from 'next/server';
import { generateGraphData } from '@/lib/graphParser';

export async function GET() {
  try {
    // forceRefresh를 true로 설정하여 항상 최신 디스크 상태를 크롤링
    const { graphData } = generateGraphData(true);
    return NextResponse.json(graphData);
  } catch (error) {
    console.error("그래프 데이터 로드 에러:", error);
    return NextResponse.json({ error: "Failed to load graph data" }, { status: 500 });
  }
}
