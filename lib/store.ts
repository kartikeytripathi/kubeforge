import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  eksMode: boolean;
  toggleEksMode: () => void;
  setEksMode: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      eksMode: false,
      toggleEksMode: () => set((s) => ({ eksMode: !s.eksMode })),
      setEksMode: (value) => set({ eksMode: value }),
    }),
    { name: "kubeforge-app" }
  )
);
