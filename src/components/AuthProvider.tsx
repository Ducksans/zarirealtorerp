'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAppStore(state => state.setUser);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          } else {
            setUser(null);
            if (pathname !== '/login' && pathname !== '/onboarding') {
              router.push('/login');
            }
          }
        } else {
          setUser(null);
          if (pathname !== '/login' && pathname !== '/onboarding') {
            router.push('/login');
          }
        }
      } catch (err) {
        setUser(null);
        if (pathname !== '/login' && pathname !== '/onboarding') {
          router.push('/login');
        }
      } finally {
        setIsInitializing(false);
      }
    }

    checkSession();
  }, [pathname, router, setUser]);

  if (isInitializing) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-pulse w-8 h-8 bg-indigo-500 rounded-full"></div></div>;
  }

  return <>{children}</>;
}
