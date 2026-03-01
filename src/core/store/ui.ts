import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface UiState {
  toasts: Toast[]
}

interface UiActions {
  addToast: (message: string, variant: ToastVariant) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export type UiStore = UiState & UiActions

export const useUiStore = create<UiStore>((set) => ({
  toasts: [],
  addToast: (message, variant) => set((state) => ({
    toasts: [...state.toasts, { id: crypto.randomUUID(), message, variant }],
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
  clearToasts: () => set({ toasts: [] }),
}))
