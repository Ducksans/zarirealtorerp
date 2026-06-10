"use client";

import Link from 'next/link';
import { useAppStore } from '@/lib/store';

export default function Navbar() {
  const user = useAppStore((state) => state.user);

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
                <Link href="/contracts" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  계약 관리
                </Link>
                <Link href="/notice" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  사내 게시판
                </Link>
                <Link href="/dashboard" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  현장 대시보드
                </Link>
                <Link href="/admin/settlements" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  100원 정산 트리
                </Link>
                <Link href="/hr/approvals" className="hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  전자결재 (M6)
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-sm font-medium text-slate-400">
              Welcome, <span className="text-white">{user?.name || 'Guest'}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
