/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

'use client';

import { useState } from 'react';
import DocumentUploadModal from '@/components/contracts/DocumentUploadModal';

// Mock Data for Contract
const MOCK_CONTRACT = {
  id: 'c_10293847',
  propertyAddress: '서울시 강남구 테헤란로 123 (강남빌딩 4층)',
  clientName: '주식회사 혁신테크 (매수인)',
  contractType: '상가매매',
  contractDate: '2026-06-15',
  agentName: '이열정 팀장',
};

// Mock Document Data
const INITIAL_DOCS = [
  { id: 'd1', type: '계약서', fileName: '강남빌딩_매매계약서_최종.pdf', uploadedAt: '2026-06-15 14:30', status: 'VERIFIED' },
  { id: 'd2', type: '중개대상물확인설명서', fileName: '확인설명서_강남빌딩.pdf', uploadedAt: '2026-06-15 14:32', status: 'VERIFIED' },
  { id: 'd3', type: '등기부등본', fileName: '강남빌딩_등기사항전부증명서.pdf', uploadedAt: '2026-06-15 10:00', status: 'VERIFIED' },
];

const REQUIRED_DOCS = [
  '계약서',
  '중개대상물확인설명서',
  '등기부등본',
  '건축물대장',
  '토지대장',
  '영수증',
  '비밀유지서약서'
];

export default function ContractArchivePage({ params }: { params: { id: string } }) {
  const [documents, setDocuments] = useState(INITIAL_DOCS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpload = (type: any, file: File) => {
    // Mocking file upload
    const newDoc = {
      id: `d_${Date.now()}`,
      type,
      fileName: file.name,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'VERIFIED'
    };
    setDocuments([...documents, newDoc]);
  };

  const getMissingDocs = () => {
    const uploadedTypes = documents.map(d => d.type);
    return REQUIRED_DOCS.filter(req => !uploadedTypes.includes(req));
  };

  const missingDocs = getMissingDocs();
  const integrityScore = Math.round((documents.length / REQUIRED_DOCS.length) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
              {MOCK_CONTRACT.contractType}
            </span>
            <span className="text-slate-400 text-sm">계약코드: {MOCK_CONTRACT.id}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{MOCK_CONTRACT.propertyAddress}</h1>
          <div className="flex items-center space-x-6 text-sm text-slate-400">
            <p>고객: <span className="text-slate-200">{MOCK_CONTRACT.clientName}</span></p>
            <p>담당자: <span className="text-slate-200">{MOCK_CONTRACT.agentName}</span></p>
            <p>계약일: <span className="text-slate-200">{MOCK_CONTRACT.contractDate}</span></p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-900/20 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          <span>신규 문서 업로드</span>
        </button>
      </div>

      {/* Integrity Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl flex flex-col justify-center items-center">
          <h3 className="text-slate-400 text-sm font-medium mb-4">계약 무결성 점수 (Integrity Score)</h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${integrityScore >= 100 ? 'text-green-500' : 'text-blue-500'}`}
                strokeDasharray={`${integrityScore}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-3xl font-bold text-white">{integrityScore}%</div>
          </div>
        </div>

        <div className="col-span-2 bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
          <h3 className="text-slate-400 text-sm font-medium mb-4">필수 법정 문서 누락 체크 (Missing Documents)</h3>
          {missingDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-green-400 bg-green-400/10 rounded-2xl border border-green-400/20">
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="font-semibold">모든 필수 법정 문서가 백업되었습니다.</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {missingDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="text-sm font-medium">{doc} 미제출</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document List */}
      <div className="bg-slate-900/40 rounded-3xl border border-slate-800 backdrop-blur-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">보관된 문서 목록</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {documents.length === 0 ? (
            <div className="p-12 text-center text-slate-500">업로드된 문서가 없습니다.</div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{doc.fileName}</h4>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-slate-400">{doc.type}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{doc.uploadedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full border border-green-500/20">
                    블록체인 해시 검증
                  </span>
                  <button className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <DocumentUploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUpload={handleUpload} 
      />
    </div>
  );
}
