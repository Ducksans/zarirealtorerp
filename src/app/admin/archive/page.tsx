/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';
import { useState } from 'react';

export default function DocumentArchiveMockup() {
  const [employees] = useState([
    { id: 1, name: '김지현', role: '팀장', docs: { idCard: true, bankBook: true, license: true, resume: true } },
    { id: 2, name: '이민수', role: '사원', docs: { idCard: true, bankBook: false, license: false, resume: true } },
    { id: 3, name: '박태양', role: '사원', docs: { idCard: false, bankBook: false, license: false, resume: false } },
  ]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">전사 문서 보관소 (Document Archive)</h1>
            <p className="text-slate-400 mt-1">임직원 제출 필수 서류 및 법인 중앙 문서 보관/검증함</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors text-sm font-semibold">
            문서 일괄 업로드
          </button>
        </header>

        {/* Drag & Drop Area */}
        <div className="border-2 border-dashed border-slate-700 bg-slate-800/50 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors cursor-pointer">
          <div className="text-4xl mb-4">📂</div>
          <h3 className="text-xl font-medium text-slate-300">파일을 이곳으로 드래그 앤 드롭하세요</h3>
          <p className="text-slate-500 mt-2">지원 형식: PDF, JPG, PNG (최대 50MB)</p>
        </div>

        {/* Document Status Table */}
        <div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800">
            <h2 className="text-lg font-semibold text-white">사원별 필수 서류 제출 현황</h2>
          </div>
          <div className="p-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="pb-3 font-medium">이름 (직급)</th>
                  <th className="pb-3 font-medium text-center">신분증 사본</th>
                  <th className="pb-3 font-medium text-center">통장 사본</th>
                  <th className="pb-3 font-medium text-center">자격증 사본</th>
                  <th className="pb-3 font-medium text-center">이력서</th>
                  <th className="pb-3 font-medium text-right">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {employees.map(emp => (
                  <tr key={emp.id} className="text-slate-300 hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">{emp.name[0]}</div>
                      <div>
                        <div className="font-medium text-slate-200">{emp.name}</div>
                        <div className="text-xs text-slate-500">{emp.role}</div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      {emp.docs.idCard ? <span className="text-emerald-400">✅ 제출</span> : <span className="text-rose-400">❌ 미제출</span>}
                    </td>
                    <td className="py-4 text-center">
                      {emp.docs.bankBook ? <span className="text-emerald-400">✅ 제출</span> : <span className="text-rose-400">❌ 미제출</span>}
                    </td>
                    <td className="py-4 text-center">
                      {emp.docs.license ? <span className="text-emerald-400">✅ 제출</span> : <span className="text-slate-500">- (해당없음/미제출)</span>}
                    </td>
                    <td className="py-4 text-center">
                      {emp.docs.resume ? <span className="text-emerald-400">✅ 제출</span> : <span className="text-rose-400">❌ 미제출</span>}
                    </td>
                    <td className="py-4 text-right">
                      {Object.values(emp.docs).filter(v => v).length === 4 ? (
                         <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-md font-medium">완료</span>
                      ) : (
                         <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs rounded-md font-medium">보완 필요</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
