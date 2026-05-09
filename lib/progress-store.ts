"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Attempt {
  labId: string;
  passed: boolean;
  at: number; // epoch ms
}

export interface Completion {
  labId: string;
  completedAt: number; // epoch ms
  durationMs: number;
}

interface ProgressState {
  attempts: Attempt[];
  completions: Completion[];

  recordAttempt: (labId: string, passed: boolean) => void;
  recordCompletion: (labId: string, durationMs: number) => void;

  // Derived helpers
  completedLabIds: () => string[];
  isCompleted: (labId: string) => boolean;
  streak: () => number;
  activityDays: () => string[]; // "YYYY-MM-DD" strings
  ckaReadiness: () => number;   // 0-100
  eksReadiness: () => number;   // 0-100 (0 until Phase D)
}

function toDateKey(epoch: number): string {
  return new Date(epoch).toISOString().slice(0, 10);
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      attempts: [],
      completions: [],

      recordAttempt(labId, passed) {
        set((s) => ({
          attempts: [...s.attempts, { labId, passed, at: Date.now() }],
        }));
      },

      recordCompletion(labId, durationMs) {
        set((s) => {
          const already = s.completions.some((c) => c.labId === labId);
          if (already) return s; // idempotent — first completion wins
          return {
            completions: [
              ...s.completions,
              { labId, completedAt: Date.now(), durationMs },
            ],
          };
        });
      },

      completedLabIds() {
        return get().completions.map((c) => c.labId);
      },

      isCompleted(labId) {
        return get().completions.some((c) => c.labId === labId);
      },

      streak() {
        const days = new Set(
          get().attempts.filter((a) => a.passed).map((a) => toDateKey(a.at))
        );
        if (days.size === 0) return 0;

        let count = 0;
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);

        // Allow today or yesterday as the streak anchor
        const todayKey = toDateKey(cursor.getTime());
        cursor.setDate(cursor.getDate() - 1);
        const yesterdayKey = toDateKey(cursor.getTime());

        if (!days.has(todayKey) && !days.has(yesterdayKey)) return 0;

        // Start counting from today backwards
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        for (let i = 0; i < 365; i++) {
          const key = toDateKey(start.getTime());
          if (!days.has(key)) break;
          count++;
          start.setDate(start.getDate() - 1);
        }
        return count;
      },

      activityDays() {
        const days = new Set(
          get().attempts.filter((a) => a.passed).map((a) => toDateKey(a.at))
        );
        return Array.from(days);
      },

      ckaReadiness() {
        const phaseAIds = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"];
        const done = get().completedLabIds();
        const phaseADone = phaseAIds.filter((id) => done.includes(id)).length;
        // Phase A = 25% of CKA readiness
        return Math.round((phaseADone / phaseAIds.length) * 25);
      },

      eksReadiness() {
        return 0; // Phase D not yet implemented
      },
    }),
    {
      name: "kubeforge-progress",
      version: 1,
    }
  )
);
