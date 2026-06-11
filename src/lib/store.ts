import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

interface AppState {
  user: User | null;
  sidebarOpen: boolean;
  theme: 'dark' | 'light' | 'system';
  setUser: (user: User | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  sidebarOpen: false,
  theme: 'dark',
  setUser: (user) => set({ user }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
