'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  // 폼 데이터 (예시)
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    ssnSuffix: '',
    phone: '',
    address: '',
    bankAccount: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제로는 API 호출 (/api/onboarding) 후 처리
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-sans">
        <div className="max-w-lg p-10 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl text-center shadow-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">사원등록 요청이 완료 되었습니다.</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            업무처리 결과는 대표 또는 총무의 회신을 대기해 주십시오.<br/>
            팀장 ➔ 본부장 ➔ 지점장 ➔ 총무/대표의 순차적 결재 및 내용 확인 후에 계정이 최종 활성화됩니다.
          </p>
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/30"
          >
            로그인 화면으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Wizard Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">신규 사원 등록 요청 (Self-Service)</h1>
          <p className="text-slate-400">정확한 개인정보와 요구 서류를 업로드해 주십시오.</p>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-800">
            <div style={{ width: `${(step / 3) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"></div>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 px-1">
            <span className={step >= 1 ? 'text-indigo-400' : ''}>1. 기본 정보</span>
            <span className={step >= 2 ? 'text-indigo-400' : ''}>2. 서류 업로드</span>
            <span className={step >= 3 ? 'text-indigo-400' : ''}>3. 최종 검토</span>
          </div>
        </div>

        {/* Wizard Form */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }}>
            
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-2">기본 인적 사항</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">성명</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">연락처</label>
                    <input required type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="010-0000-0000" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">생년월일</label>
                    <input required type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">주민등록번호 뒷자리 (암호화)</label>
                    <input required type="password" name="ssnSuffix" value={formData.ssnSuffix} onChange={handleChange} maxLength={7} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-2">등본 상 거주지 주소</label>
                    <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-2">급여 정산용 계좌번호</label>
                    <input required type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange} placeholder="은행명 000-00-00000" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-2">필수 서류 업로드</h3>
                <p className="text-sm text-amber-400">업로드하신 이력서와 자기소개서는 AI가 분석하여 향후 멘토링 계획 수립에 활용됩니다.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['이력서 (PDF)', '자기소개서 (PDF)', '주민등록등본', '통장사본', '공인중개사 자격증 (해당 시)', '최종학력증명서'].map(doc => (
                    <div key={doc} className="border border-dashed border-slate-600 rounded-xl p-6 text-center hover:bg-slate-800/50 hover:border-indigo-500 transition-colors cursor-pointer group">
                      <span className="text-2xl mb-2 block opacity-50 group-hover:opacity-100 transition-opacity">📄</span>
                      <div className="text-sm font-bold text-slate-300">{doc}</div>
                      <div className="text-xs text-slate-500 mt-1">클릭하여 파일 선택</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-2">최종 제출 전 확인</h3>
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-sm space-y-4">
                  <p className="text-slate-300"><span className="text-slate-500 inline-block w-24">성명:</span> {formData.name}</p>
                  <p className="text-slate-300"><span className="text-slate-500 inline-block w-24">연락처:</span> {formData.phone}</p>
                  <p className="text-slate-300"><span className="text-slate-500 inline-block w-24">주소:</span> {formData.address}</p>
                  <p className="text-slate-300"><span className="text-slate-500 inline-block w-24">첨부 서류:</span> 6건 등록 완료</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" required className="mt-1" />
                    <span className="text-xs text-amber-200/80 leading-relaxed">
                      본인은 입력한 정보가 모두 사실임을 확인하며, 허위 사실 기재 시 입사(계약)가 취소될 수 있음에 동의합니다.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10 pt-6 border-t border-slate-800">
              <button 
                type="button"
                onClick={() => setStep(step - 1)}
                className={`px-6 py-2.5 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors ${step === 1 ? 'invisible' : ''}`}
              >
                이전 단계
              </button>
              <button 
                type="submit"
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] transition-all"
              >
                {step === 3 ? '최종 제출 및 결재 요청' : '다음 단계'}
              </button>
            </div>
          </form>
        </div>
        
      </div>
    </div>
  );
}
