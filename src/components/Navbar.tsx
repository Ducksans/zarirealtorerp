/*---
id: Navbar.tsx
milestone: M0
why: 기본 구조 파일 (Navbar.tsx)
backlinks: []
---*/

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  if (pathname === '/dev') return null;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 text-white font-bold text-xl tracking-tight">
              ERP <span className="text-indigo-500">Core</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  대시보드
                </Link>
                <Link href="/hr" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  인사 관리
                </Link>
                <Link href="/admin/archive" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors text-emerald-400">
                  보관소(M7)
                </Link>
                <Link href="/admin/contracts" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors text-indigo-400">
                  결재(M8)
                </Link>
                <Link href="/admin/settlements" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors text-pink-400">
                  정산(M9)
                </Link>
                <Link href="/admin/crm" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors text-sky-400">
                  CRM(M10)
                </Link>
                <Link href="/admin/marketing" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors text-yellow-400">
                  마케팅(M12)
                </Link>
                <Link href="/admin/vrtours" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors text-purple-400">
                  VR임장(M14)
                </Link>
                <Link href="/admin/cards" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors text-amber-500">
                  명함(M15)
                </Link>
                <Link href="/crm" className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-sm font-bold transition-colors ml-2 flex items-center gap-1 shadow-sm">
                  ⚡ 프롭테크 CRM
                </Link>
                <Link href="/client-portal" target="_blank" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors ml-2">
                  고객포털(M13) ↗
                </Link>
                <Link href="/web" target="_blank" className="bg-black hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-black tracking-wider transition-colors ml-2 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center gap-2">
                  JARI-WEB (B2C) 🚀
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-sm font-medium text-slate-400">
              Welcome, <span className="text-white">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
