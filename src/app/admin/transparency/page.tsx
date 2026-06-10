/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

/**
 * @id AdminTransparencyDashboard
 * @milestone M15
 * @why 리더보드와 랭킹 시스템을 통해 영업조직의 건강한 경쟁심리 유도
 * @backlinks [[project_roadmap.md]]
 */
'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function TransparencyDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              📊 JARI 밸류체인 투명성 대시보드
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              단일 영업규정집(SSOT)에 기반한 1원 단위 실시간 수수료 및 진급 시뮬레이터
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
              ERP 홈으로
            </Link>
          </div>
        </div>

        {/* Top 3 Cards: My Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="text-indigo-100 text-sm font-semibold mb-1">현재 내 직급 (기본지급율)</h3>
            <div className="text-3xl font-bold mb-4">초급 관리자 (60%)</div>
            <div className="w-full bg-indigo-900/50 rounded-full h-2 mb-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs text-indigo-100">
              상급 관리자(본부장 70%) 진급까지 누적 매출 <span className="font-bold text-white">2,520만원</span> 남음
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-semibold mb-1">이번 달 확정 기본 수수료</h3>
            <div className="text-3xl font-bold text-slate-900 mb-4">₩ 12,500,000</div>
            <p className="text-xs text-emerald-600 font-medium bg-emerald-50 inline-block px-2 py-1 rounded">
              영업지원비 구간시상 (15% 룰 적용): +₩ 1,875,000 대기중
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-rose-500">
            <h3 className="text-slate-500 text-sm font-semibold mb-1">산하 조직 오버라이딩 수익</h3>
            <div className="text-3xl font-bold text-rose-600 mb-4">₩ 4,320,000</div>
            <p className="text-xs text-slate-500">
              직속 팀원(3명) 중개 총액의 10% (회사입금액 20%) 실시간 적립
            </p>
          </div>
        </div>

        {/* Value Chain Separated Income (The Prime Asset Secret) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">🌱 밸류체인 독립 분할 수당 (영구 인세 소득)</h2>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
              에이스를 키워 독립시키면 나의 평생 연금이 됩니다
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500">독립시킨 하위 조직장</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500">독립 시점</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500">분할 수당 비율</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500">이번 달 산하 총 매출액</th>
                  <th className="py-3 px-4 text-xs font-semibold text-rose-600">나의 배당 수익</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">김</div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">김수석 팀장</p>
                        <p className="text-xs text-slate-500">분당 2팀</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">2026.04.01</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-800">3% (1차 분할)</td>
                  <td className="py-4 px-4 text-sm text-slate-600">₩ 85,000,000</td>
                  <td className="py-4 px-4 text-sm font-bold text-rose-600">+ ₩ 2,550,000</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">이</div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">이프로 팀장</p>
                        <p className="text-xs text-slate-500">판교 1팀</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">2026.05.15</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-800">3% (1차 분할)</td>
                  <td className="py-4 px-4 text-sm text-slate-600">₩ 42,000,000</td>
                  <td className="py-4 px-4 text-sm font-bold text-rose-600">+ ₩ 1,260,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Blueprint / Policy Reference */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-slate-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">📖 JARI 운영규정집 실시간 연동 중</h3>
              <p className="text-xs text-slate-400">
                수수료 및 오버라이딩은 단일 진실 공급원(SSOT)인 Final_Operation_Rules.md 제5조 제4항에 근거하여 1원 단위 조작 없이 투명하게 계산됩니다.
              </p>
            </div>
            <Link href="/rulebook" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors border border-slate-700">
              규정집 원문 보기
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
