/*---
id: DocumentUploadModal.tsx
milestone: M0
why: 기본 구조 파일 (DocumentUploadModal.tsx)
backlinks: []
---*/

'use client';

import { useState } from 'react';

type DocumentType = '계약서' | '중개대상물확인설명서' | '등기부등본' | '건축물대장' | '토지대장' | '영수증' | '비밀유지서약서' | '기타';

export default function DocumentUploadModal({ 
  isOpen, 
  onClose, 
  onUpload 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onUpload: (type: DocumentType, file: File) => void;
}) {
  const [selectedType, setSelectedType] = useState<DocumentType>('계약서');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">계약 무결성 문서 업로드</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">문서 종류 (법정 분류)</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="계약서">거래 당사자 서명 계약서</option>
              <option value="중개대상물확인설명서">중개대상물 확인설명서</option>
              <option value="등기부등본">등기부 등본</option>
              <option value="건축물대장">건축물 관리대장</option>
              <option value="토지대장">토지 대장</option>
              <option value="영수증">중개보수 명세 및 영수증</option>
              <option value="비밀유지서약서">비밀유지 서약서 (NDA)</option>
              <option value="기타">기타 문서</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">파일 첨부</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-slate-400">
                    {selectedFile ? <span className="font-semibold text-blue-400">{selectedFile.name}</span> : <span>클릭하거나 파일을 드래그하세요</span>}
                  </p>
                  <p className="text-xs text-slate-500">PDF, JPG, PNG (MAX. 10MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
          >
            취소
          </button>
          <button 
            onClick={() => {
              if (selectedFile) {
                onUpload(selectedType, selectedFile);
                setSelectedFile(null);
                onClose();
              }
            }}
            disabled={!selectedFile}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            문서 암호화 및 업로드
          </button>
        </div>
      </div>
    </div>
  );
}
