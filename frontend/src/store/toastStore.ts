// SPDX-License-Identifier: MIT
import { create } from 'zustand';

export const MAX_VISIBLE_TOASTS = 4;
export const DEFAULT_TOAST_DURATION = 3000;
export const PROGRESS_TICK_INTERVAL_MS = 50;

export type ToastType = 'error' | 'success' | 'info' | 'loading' | 'invitation';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  /** Optional action label + callback (used by invitation toasts). */
  action?: { label: string; onClick: () => void };
  /** Optional duration in milliseconds (defaults to 3000ms). */
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (
    message: string,
    type?: ToastType,
    action?: Toast['action'],
    duration?: number
  ) => number;
  removeToast: (id: number) => void;
  clearToasts: () => void;
}

let nextToastId = 1;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, type = 'error', action, duration) => {
    const id = nextToastId++;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, action, duration }],
    }));
    return id;
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),
}));
