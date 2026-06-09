'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ROLES_KO } from '@/types';
import OrgGraphView from '@/components/hr/OrgGraphView';
import SalesTrendChart from '@/components/hr/SalesTrendChart';

export default function EmployeeProfileDashboard() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetch(`/api/users/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-indigo-400 font-semibold animate-pulse text-lg">데이터를 불러오는 중입니다...</div>
    </div>
  );
  if (!user) return <div className="p-8 text-center text-red-400">사용자를 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* 1. Header (이름, 직급, 뒤로가기) */}
      <div className="flex justify-between items-end bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">{user.name}</h1>
            <span className="text-sm px-4 py-1 bg-indigo-600 text-white rounded-full shadow font-medium">
              {ROLES_KO[user.role as keyof typeof ROLES_KO]}
            </span>
            {user.status === 'RESIGNED' && (
              <span className="text-sm px-4 py-1 bg-red-600 text-white rounded-full shadow font-medium">퇴사자</span>
            )}
          </div>
          <div className="text-slate-400 flex gap-4 text-sm font-medium">
            <span>🏢 사번: <span className="text-slate-200">{user.employeeId}</span></span>
            <span>📅 입사일: <span className="text-slate-200">{new Date(user.joinedAt).toLocaleDateString()}</span></span>
          </div>
        </div>
        <button 
          onClick={() => router.back()} 
          className="px-6 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 font-medium"
        >
          ← 전체 목록으로
        </button>
      </div>

      {/* 2. Main Dashboard Grid (계보도 & 매출 차트) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left: Org Graph (Obsidian Style) */}
        <div className="xl:col-span-5 bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-500">🕸️</span> 조직 계보도
            </h2>
            <span className="text-xs text-slate-500">인터랙티브 뷰어 (드래그/줌 가능)</span>
          </div>
          <div className="flex-1 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
            <OrgGraphView user={user} />
          </div>
        </div>

        {/* Right: Sales & Stats */}
        <div className="xl:col-span-7 bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg flex flex-col h-[500px]">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-emerald-500">📈</span> 매출 추이 및 실적
          </h2>
          
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 mb-1 font-medium">입사 후 누적 매출</div>
              <div className="text-xl font-bold text-white">{(user.analytics?.totalSales || 0).toLocaleString()}원</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 mb-1 font-medium">팀장 진급 후</div>
              <div className="text-xl font-bold text-indigo-400">{(user.analytics?.salesAfterTeamLeader || 0).toLocaleString()}원</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 mb-1 font-medium">본부장 진급 후</div>
              <div className="text-xl font-bold text-purple-400">{(user.analytics?.salesAfterDivHead || 0).toLocaleString()}원</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 mb-1 font-medium">지점장 진급 후</div>
              <div className="text-xl font-bold text-emerald-400">{(user.analytics?.salesAfterBranchMgr || 0).toLocaleString()}원</div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 min-h-0 bg-slate-950 rounded-xl border border-slate-700 p-4">
            <SalesTrendChart data={user.analytics?.monthlyTrend || []} />
          </div>
        </div>

      </div>

      {/* 3. Bottom Tabs (Info, Documents, Logs) */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-700 bg-slate-800/50 px-4 pt-4 gap-2">
          {['info', 'documents', 'audit'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                activeTab === tab 
                  ? 'bg-slate-900 text-indigo-400 border-t border-x border-slate-700' 
                  : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab === 'info' ? '개인 및 정산 정보' : tab === 'documents' ? '첨부 증명 서류' : '변경 이력 (Audit Log)'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-indigo-400 border-b border-slate-700 pb-2">기본 인적사항</h3>
                <div className="grid grid-cols-3 gap-y-4 text-sm">
                  <div className="text-slate-500 font-medium">생년월일</div>
                  <div className="col-span-2 text-white">{user.birthDate || '-'}</div>
                  <div className="text-slate-500 font-medium">주민번호 뒷자리</div>
                  <div className="col-span-2 text-white">{user.ssnSuffix ? `******* (암호화 됨)` : '-'}</div>
                  <div className="text-slate-500 font-medium">전화번호</div>
                  <div className="col-span-2 text-white">{user.phone || '-'}</div>
                  <div className="text-slate-500 font-medium">등본 상 주소</div>
                  <div className="col-span-2 text-white">{user.address || '-'}</div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-indigo-400 border-b border-slate-700 pb-2">정산 및 이력 정보</h3>
                <div className="grid grid-cols-3 gap-y-4 text-sm">
                  <div className="text-slate-500 font-medium">등록 계좌번호</div>
                  <div className="col-span-2 text-white font-mono bg-slate-950 px-3 py-1.5 rounded inline-block w-fit">
                    {user.bankAccount || '미등록'}
                  </div>
                  <div className="text-slate-500 font-medium mt-4">진급 히스토리</div>
                  <div className="col-span-2 mt-4">
                    <ul className="space-y-2 relative before:absolute before:inset-y-0 before:left-[7px] before:w-0.5 before:bg-slate-700">
                      {user.roleHistory?.map((h: any, idx: number) => (
                        <li key={idx} className="relative pl-6 flex items-center justify-between text-sm">
                          <span className="absolute left-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900"></span>
                          <span className="text-white font-medium">{ROLES_KO[h.role as keyof typeof ROLES_KO]}</span>
                          <span className="text-slate-400">{new Date(h.promotedAt).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-lg font-bold text-indigo-400">제출된 증명 서류 아카이브</h3>
                <span className="text-sm text-slate-500">총 {user.documents?.length || 0}건의 서류가 등록되어 있습니다.</span>
              </div>
              
              {user.documents?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {user.documents.map((doc: any) => (
                    <a 
                      href={doc.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      key={doc.id} 
                      className="group p-5 bg-slate-950 border border-slate-700 rounded-xl hover:border-indigo-500 hover:shadow-indigo-500/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-4xl mb-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">📄</span>
                      <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{doc.type}</div>
                      <div className="text-xs text-slate-500 mt-2">{new Date(doc.uploadedAt).toLocaleDateString()} 등록</div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-4xl opacity-50 block mb-4">📭</span>
                  <p className="text-slate-400 font-medium">아직 제출된 증명 서류가 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <div>
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-lg font-bold text-indigo-400">데이터 무결성 변경 추적 (Audit Log)</h3>
                <span className="text-sm text-slate-500">최초 등록부터 모든 수정 내역이 타임라인으로 기록됩니다.</span>
              </div>
              
              {user.auditLogs?.length > 0 ? (
                <div className="space-y-4">
                  {user.auditLogs.map((log: any) => (
                    <div key={log.id} className="bg-slate-950 border border-slate-700 p-4 rounded-xl flex gap-4">
                      <div className="flex flex-col items-center justify-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg
                          ${log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 
                            log.action === 'UPDATE' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 
                            'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                        >
                          {log.action === 'CREATE' ? '생성' : log.action === 'UPDATE' ? '수정' : '삭제'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white">{log.reason || '시스템 변경'}</span>
                          <span className="text-sm text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-slate-400 mb-2">처리자 ID: {log.actorId}</div>
                        {log.action === 'CREATE' ? (
                          <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs text-slate-300 max-h-24 overflow-y-auto font-mono">
                            {log.afterData}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div className="bg-red-950/30 p-2 rounded border border-red-900/50 text-red-300">
                              <span className="block font-bold mb-1 opacity-70">변경 전:</span>
                              {log.beforeData}
                            </div>
                            <div className="bg-emerald-950/30 p-2 rounded border border-emerald-900/50 text-emerald-300">
                              <span className="block font-bold mb-1 opacity-70">변경 후:</span>
                              {log.afterData}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-medium">기록된 로그가 없습니다.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
