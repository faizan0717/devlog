import { create } from 'zustand'

export type Theme = 'day' | 'sunset' | 'night'

function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t
  localStorage.setItem('theme', t)
}

const storedTheme = (localStorage.getItem('theme') as Theme | null) ?? 'day'
applyTheme(storedTheme)

interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
  theme: Theme

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (id: string) => void
  closeModal: () => void
  setTheme: (t: Theme) => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  activeModal: null,
  theme: storedTheme,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
}))
