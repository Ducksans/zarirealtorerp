/*---
id: page.tsx
milestone: M0
why: 페이지 UI 진입점 (page.tsx)
backlinks: [[[Pages]]]
---*/

/**
 * @id OnboardingForm
 * @milestone M4
 * @why 신규 입사자의 개인정보와 전자서명을 한 번의 링크 전송으로 수집
 * @backlinks [[project_roadmap.md]]
 */
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PremiumOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '',
    q1: '', q2: '', q3: '', q4: '', q5: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const saveDraft = () => {
    alert('작성하신 내용이 안전하게 임시저장 되었습니다. 나중에 브라우저를 다시 열어 이어서 작성할 수 있습니다.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('입사 지원이 완료되었습니다. 대표님과 AI가 검토 후 빠른 시일 내에 연락 드리겠습니다.');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-slate-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-slate-900/95 z-10"></div>
        {/* Placeholder for video/image background */}
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center"></div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-6 backdrop-blur-sm text-sm font-bold text-indigo-300">
            Recruitment
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">투명함이 만드는 압도적 성과</h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-light">
            낡은 중개 관행을 파괴하고, 시스템과 함께 100% 노력한 만큼 보상받는 곳.<br/>
            최고의 무대에서 당신의 잠재력을 폭발시키십시오.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto mt-[-40px] relative z-30 px-4">
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
          
          {/* Progress Header */}
          <div className="flex border-b border-slate-100">
            <button onClick={() => setStep(1)} className={`flex-1 py-5 text-center font-bold text-sm transition-colors ${step === 1 ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:bg-slate-50'}`}>1. 기본 정보 및 이력서</button>
            <button onClick={() => setStep(2)} className={`flex-1 py-5 text-center font-bold text-sm transition-colors ${step === 2 ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:bg-slate-50'}`}>2. 컬쳐핏 (Culture Fit) 인터뷰</button>
          </div>

          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }} className="p-8 md:p-12">
            
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">기본 정보</h2>
                  <p className="text-slate-500 text-sm">면접 연락을 위한 최소한의 필수 정보만 기재해 주십시오.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">성명</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="홍길동" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">연락처</label>
                    <input required type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="010-0000-0000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">이메일</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="example@email.com" />
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">이력서 및 포트폴리오 <span className="text-slate-400 text-base font-normal">(선택)</span></h2>
                  <p className="text-slate-500 text-sm mb-6">미리 작성해두신 이력서나 포트폴리오가 있다면 가볍게 첨부해 주세요.</p>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 transition-colors cursor-pointer group">
                    <div className="text-5xl mb-4 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">📤</div>
                    <div className="font-bold text-slate-600 group-hover:text-indigo-600 text-lg">파일을 이곳으로 드래그 앤 드롭</div>
                    <div className="text-sm text-slate-400 mt-2">PDF, DOCX, PPTX 지원 (최대 50MB)</div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-[0_10px_20px_rgba(79,70,229,0.2)] hover:shadow-[0_10px_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all">다음 단계로 →</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-3">5대 핵심 질문 (Culture Fit)</h2>
                  <p className="text-slate-600 text-sm leading-relaxed bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    💡 <b>자리공인중개사사무소는 천편일률적인 자기소개서를 요구하지 않습니다.</b><br/>
                    아래 5가지 질문에 대한 진솔하고 날카로운 답변을 통해 본인의 철학과 열정을 대표님께 직접 어필해 주십시오.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="block font-bold text-slate-800 text-lg leading-snug">
                      <span className="text-indigo-600 mr-2 text-xl">Q1.</span> 
                      자리공인중개사사무소는 수많은 중개 사무소 중 하나입니다. 많은 선택지에도 불구하고 입사지원하시게 된 <span className="bg-indigo-100 text-indigo-800 px-1 rounded">가장 원초적인 이유</span>가 궁금합니다.
                    </label>
                    <textarea required name="q1" value={formData.q1} onChange={handleChange} rows={5} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 leading-relaxed transition-shadow" placeholder="솔직한 동기를 자유롭게 적어주세요."></textarea>
                  </div>

                  <div className="space-y-3">
                    <label className="block font-bold text-slate-800 text-lg leading-snug">
                      <span className="text-indigo-600 mr-2 text-xl">Q2.</span> 
                      부동산 중개업에서 당연하게 강조되어야 할 <span className="bg-indigo-100 text-indigo-800 px-1 rounded">투명/공정/상식 기반의 플랫폼</span>이 어떤 미래를 이끌어 낼 수 있다고 생각하십니까?
                    </label>
                    <textarea required name="q2" value={formData.q2} onChange={handleChange} rows={5} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 leading-relaxed transition-shadow"></textarea>
                  </div>

                  <div className="space-y-3">
                    <label className="block font-bold text-slate-800 text-lg leading-snug">
                      <span className="text-indigo-600 mr-2 text-xl">Q3.</span> 
                      미리 준비된 <span className="bg-indigo-100 text-indigo-800 px-1 rounded">ERP 데모 사이트</span>를 꼼꼼히 살펴보셨는지요? 어떤 점을 느끼셨고, 혹시 입사하시게 된다면 제안하시고 싶으신 부분이 있으신지요?
                    </label>
                    <textarea required name="q3" value={formData.q3} onChange={handleChange} rows={5} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 leading-relaxed transition-shadow" placeholder="불편했던 점, 추가되었으면 하는 기능 등 가감 없이 제안해 주세요."></textarea>
                  </div>

                  <div className="space-y-3">
                    <label className="block font-bold text-slate-800 text-lg leading-snug">
                      <span className="text-indigo-600 mr-2 text-xl">Q4.</span> 
                      개인 능력의 향상과 시스템의 정교화를 통해 <span className="bg-indigo-100 text-indigo-800 px-1 rounded">지원자님의 미래가 어떻게 바뀔 것인지</span> 상상해 보시고 그 상상을 공유해 주세요.
                    </label>
                    <textarea required name="q4" value={formData.q4} onChange={handleChange} rows={5} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 leading-relaxed transition-shadow"></textarea>
                  </div>

                  <div className="space-y-3">
                    <label className="block font-bold text-slate-800 text-lg leading-snug">
                      <span className="text-indigo-600 mr-2 text-xl">Q5.</span> 
                      입사 후 포부와 목표를 <span className="bg-indigo-100 text-indigo-800 px-1 rounded">단기, 중기, 장기의 관점</span>에서 말씀해 주세요.
                    </label>
                    <textarea required name="q5" value={formData.q5} onChange={handleChange} rows={5} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 leading-relaxed transition-shadow"></textarea>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-100 gap-4">
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-3.5 font-bold text-slate-500 hover:text-slate-800 transition-colors order-2 sm:order-1">← 기본 정보로 돌아가기</button>
                  <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
                    <button type="button" onClick={saveDraft} className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">💾 임시저장</button>
                    <button type="submit" className="flex-1 sm:flex-none px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_10px_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all">🚀 최종 입사 지원</button>
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>
      </main>
    </div>
  );
}
