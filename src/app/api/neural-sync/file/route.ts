/*---
id: route.ts
milestone: M0
why: API 라우트 엔드포인트 (route.ts)
backlinks: [[[API_Routes]]]
---*/

import { NextResponse } from 'next/server';
import fs from 'fs';
import { generateGraphData } from '@/lib/graphParser';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: "Missing file id" }, { status: 400 });
  }

  try {
    // 1. graphParser의 최신 절대 경로 매핑 테이블(fileMap)을 가져옴
    const { fileMap } = generateGraphData();

    // 2. ID에 해당하는 절대 경로 획득
    const absolutePath = fileMap[id];

    if (!absolutePath || !fs.existsSync(absolutePath)) {
      return NextResponse.json({ 
        error: "File not found", 
        content: `# ⚠️ ${id} 파일을 디스크에서 찾을 수 없습니다.\n\n이 파일은 삭제되었거나 이름이 변경되었을 수 있습니다.` 
      }, { status: 404 });
    }

    // 3. 파일 원문 리턴
    const content = fs.readFileSync(absolutePath, 'utf8');
    return NextResponse.json({ content });

  } catch (error) {
    console.error("파일 로드 에러:", error);
    return NextResponse.json({ 
      error: "Internal Error", 
      content: `# 🚨 서버 내부 에러\n\n파일을 읽는 도중 오류가 발생했습니다.\n\`${error}\`` 
    }, { status: 500 });
  }
}
