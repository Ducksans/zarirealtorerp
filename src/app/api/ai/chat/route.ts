import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, userId } = body;

        // Mock response analyzing a user's settlement drop
        const mockResponse = {
            reply: `안녕하세요! 이번 달 정산 수수료가 지난 달 대비 소폭 하락한 이유를 분석해 보았습니다. 최근 '인증 매물' 실적은 훌륭하지만, 지점(프랜차이즈) 오버라이딩 비율이 높은 상업용 신규 구역의 클로징 비율이 15% 하락했습니다. 해당 구역의 집중 타겟팅을 통해 팀 빌딩(100원 오버라이딩) 파이를 키우는 것을 추천합니다. 관련된 우수 매물 리스트를 추천해 드릴까요?`,
            analyzedData: {
                trend: 'downward',
                suggestedAction: 'focus_commercial_zones'
            }
        };

        return NextResponse.json(mockResponse, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
