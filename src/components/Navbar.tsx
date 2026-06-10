"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare, 
  Map, 
  Calculator, 
  ClipboardCheck,
  UserCircle
} from 'lucide-react';

const navItems = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '인사 관리', href: '/hr', icon: Users },
  { name: '계약 관리', href: '/contracts', icon: FileText },
  { name: '사내 게시판', href: '/notice', icon: MessageSquare },
  { name: '현장 대시보드', href: '/dashboard', icon: Map },
  { name: '정산 트리', href: '/admin/settlements', icon: Calculator },
  { name: '전자결재', href: '/hr/approvals', icon: ClipboardCheck },
];

export default function Navbar() {
  const user = useAppStore((state) => state.user);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex-col z-50 shadow-2xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <Link href="/" className="text-white font-bold text-2xl tracking-tight">
            ERP <span className="text-indigo-500">Core</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-indigo-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                {item.name}
              </Link>
            )
          })}
        </div>
        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800">
            <UserCircle className="text-indigo-400" size={32} />
            <div className="text-sm min-w-0">
              <p className="text-slate-500 text-xs">Welcome back,</p>
              <p className="text-white font-bold truncate">{user?.name || 'Guest'}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom App Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center overflow-x-auto no-scrollbar px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex flex-col items-center justify-center min-w-[76px] py-3 px-1 transition-colors relative ${
                  isActive ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-b-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                )}
                <item.icon size={22} className={`mb-1 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className={`text-[10px] whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-50 flex items-center justify-between px-4 shadow-sm">
        <Link href="/" className="text-white font-bold text-xl tracking-tight">
          ERP <span className="text-indigo-500">Core</span>
        </Link>
        <UserCircle className="text-slate-400" size={24} />
      </header>
    </>
  );
}
