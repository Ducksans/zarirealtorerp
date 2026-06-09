'use client';

import { useState, useEffect, useRef } from 'react';
import DaumPostcode from 'react-daum-postcode';

type User = {
  id: string;
  employeeId: string;
  name: string;
  role: string;
};

interface UserFormProps {
  onUserAdded: () => void;
}

const DOCUMENT_TYPES = [
  '이력서', '자기소개서', '주민등록등본', '통장사본', 
  '자격증', '교육이수증', '인장', '기타서류'
];

export default function UserForm({ onUserAdded }: UserFormProps) {
  // 폼 기본 상태
  const [formData, setFormData] = useState({ 
    name: '', 
    role: 'REGULAR', 
    uplineId: '',
    uplineDisplay: '', // 확정된 사수 표시용
    birthDate: '',
    ssnSuffix: '',
    phone: '',
    address: '',
    bankName: '',
    bankAccount: '',
    joinedAt: new Date().toISOString().split('T')[0]
  });

  // 서류 업로드 및 미리보기 상태
  const [documents, setDocuments] = useState<Record<string, File>>({});
  const [documentPreviews, setDocumentPreviews] = useState<Record<string, string>>({});

  // UI 조작 상태
  const [uplineSearch, setUplineSearch] = useState('');
  const [uplineOptions, setUplineOptions] = useState<User[]>([]);
  const [isUplineSearchOpen, setIsUplineSearchOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 동명이인 검증 상태
  const [homonymModalOpen, setHomonymModalOpen] = useState(false);
  const [homonymList, setHomonymList] = useState<any[]>([]);

  // 컴포넌트 마운트 시 LocalStorage에서 임시저장 데이터 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('hr_temp_form');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch(e) {}
    }
  }, []);

  // 임시 저장 함수
  const handleTempSave = () => {
    // 민감정보 제외하고 저장
    const { ssnSuffix, ...safeData } = formData;
    localStorage.setItem('hr_temp_form', JSON.stringify(safeData));
    alert('임시저장 되었습니다. (주민등록번호 등 민감정보 및 첨부파일 제외)');
  };

  // -------------------------
  // 1. 사수 배정 (3단계 프로토콜)
  // -------------------------
  const handleUplineSearch = async () => {
    if (!uplineSearch) return alert('검색어를 입력하세요.');
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(uplineSearch)}`);
      const data = await res.json();
      if (data.users) {
        setUplineOptions(data.users.filter((u: User) => u.role !== 'REGULAR'));
        setIsUplineSearchOpen(true);
      }
    } catch (e) {
      alert('검색 중 오류가 발생했습니다.');
    }
  };

  const handleUplineConfirm = (u: User) => {
    setFormData({ ...formData, uplineId: u.id, uplineDisplay: `${u.name} (${u.employeeId})` });
    setIsUplineSearchOpen(false);
  };

  const handleUplineClear = () => {
    setFormData({ ...formData, uplineId: '', uplineDisplay: '' });
    setUplineSearch('');
  };

  // -------------------------
  // 2. 계좌번호 체계 정규화
  // -------------------------
  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, bankName: e.target.value, bankAccount: '' });
  };

  const formatBankAccount = (bank: string, value: string) => {
    // 숫자만 추출
    let num = value.replace(/[^\d]/g, '');
    if (!bank) return num;

    // 간단한 은행별 하이픈 마스킹 예시 (실무에 맞춰 정밀하게 조정 가능)
    if (bank === '국민은행') { // 6자리-2자리-6자리
      if(num.length < 7) return num;
      if(num.length < 9) return `${num.slice(0,6)}-${num.slice(6)}`;
      return `${num.slice(0,6)}-${num.slice(6,8)}-${num.slice(8,14)}`;
    } else if (bank === '신한은행') { // 3자리-3자리-6자리
      if(num.length < 4) return num;
      if(num.length < 7) return `${num.slice(0,3)}-${num.slice(3)}`;
      return `${num.slice(0,3)}-${num.slice(3,6)}-${num.slice(6,12)}`;
    } else if (bank === '농협은행') { // 3자리-4자리-4자리-2자리
      if(num.length < 4) return num;
      if(num.length < 8) return `${num.slice(0,3)}-${num.slice(3)}`;
      if(num.length < 12) return `${num.slice(0,3)}-${num.slice(3,7)}-${num.slice(7)}`;
      return `${num.slice(0,3)}-${num.slice(3,7)}-${num.slice(7,11)}-${num.slice(11,13)}`;
    }
    return num; // 기타 은행
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBankAccount(formData.bankName, e.target.value);
    setFormData({ ...formData, bankAccount: formatted });
  };

  // -------------------------
  // 3. 도로명 주소 API (Daum)
  // -------------------------
  const handleAddressComplete = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = '';

    if (data.addressType === 'R') {
      if (data.bname !== '') extraAddress += data.bname;
      if (data.buildingName !== '') extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
      fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
    }
    setFormData({ ...formData, address: fullAddress });
    setIsAddressModalOpen(false);
  };

  // -------------------------
  // 4. 서류 8종 다중 업로드 및 미리보기
  // -------------------------
  const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocuments(prev => ({ ...prev, [type]: file }));
      
      const objectUrl = URL.createObjectURL(file);
      setDocumentPreviews(prev => ({ ...prev, [type]: objectUrl }));
    }
  };

  useEffect(() => {
    // 메모리 누수 방지
    return () => {
      Object.values(documentPreviews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [documentPreviews]);


  // -------------------------
  // 전송 처리 및 동명이인 검증
  // -------------------------
  const processSubmit = async () => {
    setLoading(true);
    try {
      const formPayload = new FormData();
      
      // 일반 데이터 append
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formPayload.append(key, value);
      });

      // 통합 계좌번호 (은행명 + 계좌)
      if (formData.bankName && formData.bankAccount) {
        formPayload.append('fullBankAccount', `${formData.bankName} ${formData.bankAccount}`);
      }

      // 파일 append
      Object.entries(documents).forEach(([type, file]) => {
        formPayload.append(`file_${type}`, file);
      });

      const res = await fetch('/api/users', {
        method: 'POST',
        body: formPayload, // multipart/form-data 자동 지정
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(`오류: ${err.error || '사원 등록에 실패했습니다.'}`);
        setLoading(false);
        return;
      }

      // 성공 시 LocalStorage 클리어
      localStorage.removeItem('hr_temp_form');
      onUserAdded();
    } catch (e) {
      alert('사원 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('이름을 입력해주세요.');
    if (!formData.bankName && formData.bankAccount) return alert('은행을 선택해주세요.');
    
    // 1. 동명이인 검증
    try {
      const res = await fetch(`/api/users/check-homonym?name=${encodeURIComponent(formData.name)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.users && data.users.length > 0) {
          setHomonymList(data.users);
          setHomonymModalOpen(true);
          return; // 모달이 뜨면 여기서 중단.
        }
      }
    } catch (e) {
      console.error('동명이인 검증 실패', e);
    }

    // 동명이인이 없다면 바로 진행
    await processSubmit();
  };

  return (
    <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">신규 사원 상세 등록</h2>
        <button 
          onClick={handleTempSave}
          className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          💾 임시저장
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. 필수 기본 인사 정보 */}
        <section>
          <h3 className="text-lg font-semibold text-indigo-400 mb-4 border-b border-slate-700 pb-2">1. 기본 인사 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">이름 <span className="text-red-400">*</span></label>
              <input 
                type="text" required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">입사일</label>
              <input 
                type="date" 
                value={formData.joinedAt}
                onChange={e => setFormData({...formData, joinedAt: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">직급 <span className="text-red-400">*</span></label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="REGULAR">사원 (REGULAR)</option>
                <option value="TEAM_LEADER">팀장 (TEAM_LEADER)</option>
                <option value="DIV_HEAD">본부장 (DIV_HEAD)</option>
                <option value="BRANCH_MGR">지점장 (BRANCH_MGR)</option>
              </select>
            </div>
            
            {/* 사수 배정 영역 */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-400 mb-1">사수 배정 (검색 및 확정)</label>
              {formData.uplineDisplay ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-indigo-900/40 border border-indigo-500/50 text-indigo-200 rounded-lg px-4 py-2 flex justify-between items-center">
                    <span>{formData.uplineDisplay}</span>
                    <span className="text-xs font-semibold bg-indigo-500 text-white px-2 py-0.5 rounded">확정됨</span>
                  </div>
                  <button type="button" onClick={handleUplineClear} className="bg-red-900/40 hover:bg-red-900/60 text-red-400 px-3 py-2 rounded-lg border border-red-800 transition-colors">
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={uplineSearch}
                    onChange={e => setUplineSearch(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="상사이름/사번 검색"
                  />
                  <button type="button" onClick={handleUplineSearch} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors">
                    검색
                  </button>
                </div>
              )}

              {/* 검색 결과 팝업 */}
              {isUplineSearchOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-slate-600 shadow-xl rounded-lg z-50 max-h-60 overflow-y-auto">
                  <div className="p-2 flex justify-between items-center border-b border-slate-700">
                    <span className="text-xs text-slate-400 font-semibold">검색 결과 (선택하여 확정)</span>
                    <button type="button" onClick={() => setIsUplineSearchOpen(false)} className="text-slate-500 hover:text-white">✕</button>
                  </div>
                  {uplineOptions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">결과가 없습니다.</div>
                  ) : (
                    <ul className="divide-y divide-slate-700">
                      {uplineOptions.map(u => (
                        <li key={u.id} className="p-3 hover:bg-slate-700/50 flex justify-between items-center transition-colors">
                          <div>
                            <div className="text-sm font-medium text-white">{u.name}</div>
                            <div className="text-xs text-slate-400">{u.employeeId} | {u.role}</div>
                          </div>
                          <button type="button" onClick={() => handleUplineConfirm(u)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded">
                            확정
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. 개인정보 및 정산 정보 */}
        <section>
          <h3 className="text-lg font-semibold text-indigo-400 mb-4 border-b border-slate-700 pb-2">2. 상세 개인정보 (급여/세금 처리용)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">생년월일</label>
              <input 
                type="date" 
                value={formData.birthDate}
                onChange={e => setFormData({...formData, birthDate: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">주민등록번호 뒷자리</label>
              <input 
                type="password" 
                maxLength={7}
                value={formData.ssnSuffix}
                onChange={e => setFormData({...formData, ssnSuffix: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="7자리 숫자 (자동 암호화)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">전화번호</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="010-0000-0000"
              />
            </div>
            
            {/* 계좌번호 폼 */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">본인 명의 계좌번호</label>
              <div className="flex gap-2 mb-2">
                <select 
                  value={formData.bankName}
                  onChange={handleBankSelect}
                  className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="">은행선택</option>
                  <option value="국민은행">국민은행</option>
                  <option value="신한은행">신한은행</option>
                  <option value="농협은행">농협은행</option>
                  <option value="우리은행">우리은행</option>
                  <option value="하나은행">하나은행</option>
                  <option value="카카오뱅크">카카오뱅크</option>
                </select>
                <input 
                  type="text" 
                  value={formData.bankAccount}
                  onChange={handleAccountChange}
                  className="w-2/3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="계좌번호 입력"
                  disabled={!formData.bankName}
                />
              </div>
            </div>

            {/* 주소 검색 (Daum Postcode) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">거주지 주소 (등본 상 주소)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly
                  value={formData.address}
                  className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 focus:outline-none cursor-not-allowed"
                  placeholder="우측 버튼을 눌러 주소를 검색하세요."
                />
                <button 
                  type="button" 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  주소 검색
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 첨부서류 업로드 */}
        <section>
          <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
            <h3 className="text-lg font-semibold text-indigo-400">3. 제출 증명 서류 (8종 필수/선택)</h3>
            <span className="text-xs text-slate-500">이미지 또는 PDF 권장 (최초 등록 시 1회 제출)</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DOCUMENT_TYPES.map((docType) => (
              <div key={docType} className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center text-center relative group">
                {documentPreviews[docType] ? (
                  <div className="w-full h-24 mb-2 relative overflow-hidden rounded border border-slate-600 bg-slate-800">
                    {/* 이미지 미리보기 */}
                    <img src={documentPreviews[docType]} alt={docType} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setDocuments(p => { const newDocs = {...p}; delete newDocs[docType]; return newDocs; });
                        setDocumentPreviews(p => { const newPrev = {...p}; delete newPrev[docType]; return newPrev; });
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs font-bold shadow-lg"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-24 mb-2 flex items-center justify-center border-2 border-dashed border-slate-700 rounded bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-500 transition-all cursor-pointer">
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                      <span className="text-2xl opacity-50 mb-1">📄</span>
                      <span className="text-xs text-slate-400 group-hover:text-indigo-400">파일 찾기</span>
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        className="hidden" 
                        onChange={(e) => handleFileChange(docType, e)}
                      />
                    </label>
                  </div>
                )}
                <span className="text-xs font-medium text-slate-300">{docType}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 제출 버튼 */}
        <div className="pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-4 px-4 rounded-xl transition-colors text-lg shadow-lg"
          >
            {loading ? '데이터 처리 및 서류 업로드 중...' : '최종 확정 및 사번 발급'}
          </button>
          <p className="text-center text-xs text-slate-500 mt-3">
            확정 시점부터 Audit Log에 모든 입력 데이터의 스냅샷이 영구 기록되어 추적 가능해집니다.
          </p>
        </div>
      </form>

      {/* Daum 주소 검색 모달 */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg overflow-hidden w-full max-w-md relative">
            <div className="bg-indigo-600 p-3 flex justify-between items-center text-white">
              <span className="font-semibold text-sm">도로명 주소 검색</span>
              <button onClick={() => setIsAddressModalOpen(false)}>✕ 닫기</button>
            </div>
            <DaumPostcode onComplete={handleAddressComplete} autoClose={false} style={{ height: '400px' }} />
          </div>
        </div>
      )}

      {/* 동명이인 검증 모달 */}
      {homonymModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-slate-800 border border-red-500/50 shadow-2xl rounded-xl w-full max-w-lg overflow-hidden">
            <div className="bg-red-500/10 p-5 border-b border-red-500/20">
              <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                ⚠️ 동명이인 등록 주의
              </h3>
              <p className="text-sm text-slate-300 mt-2">
                현재 재직 중인 사원 중 <strong>"{formData.name}"</strong> 님과 이름이 동일한 사원이 이미 존재합니다. <br/>
                아래 정보를 확인하여 완전히 다른 사람(신규 입사자)이 맞는지 확인해주세요.
              </p>
            </div>
            <div className="p-5">
              <ul className="space-y-3">
                {homonymList.map(h => (
                  <li key={h.id} className="bg-slate-900 border border-slate-700 p-3 rounded-lg flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{h.name} <span className="text-indigo-400 text-sm">({h.employeeId})</span></span>
                      <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{h.role}</span>
                    </div>
                    <div className="text-sm text-slate-400 flex gap-4">
                      <span>🎂 {h.birthDate}</span>
                      <span>📱 {h.phone}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 border-t border-slate-700 flex gap-3 bg-slate-900/50">
              <button 
                type="button"
                onClick={() => setHomonymModalOpen(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors font-medium"
              >
                등록 취소 (닫기)
              </button>
              <button 
                type="button"
                onClick={() => {
                  setHomonymModalOpen(false);
                  processSubmit(); // 확인 후 강제 진행
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg transition-colors font-medium"
              >
                동일인 아님 (신규 사번 발급)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
