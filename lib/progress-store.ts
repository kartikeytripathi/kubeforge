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

// Store holds only raw serializable state + mutations.
// Derived values are pure functions below — call them in components
// after selecting the raw arrays, so Zustand's Object.is comparison works.
interface ProgressState {
  attempts: Attempt[];
  completions: Completion[];
  recordAttempt: (labId: string, passed: boolean) => void;
  recordCompletion: (labId: string, durationMs: number) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      attempts: [],
      completions: [],

      recordAttempt(labId, passed) {
        set((s) => ({
          attempts: [...s.attempts, { labId, passed, at: Date.now() }],
        }));
      },

      recordCompletion(labId, durationMs) {
        set((s) => {
          if (s.completions.some((c) => c.labId === labId)) return s;
          return {
            completions: [
              ...s.completions,
              { labId, completedAt: Date.now(), durationMs },
            ],
          };
        });
      },
    }),
    { name: "kubeforge-progress", version: 1 }
  )
);

// ─── Pure derived helpers ─────────────────────────────────────────────────────
// Use these in components after selecting the raw arrays from the store.

function toDateKey(epoch: number): string {
  return new Date(epoch).toISOString().slice(0, 10);
}

export function getCompletedLabIds(completions: Completion[]): string[] {
  return completions.map((c) => c.labId);
}

export function isLabCompleted(completions: Completion[], labId: string): boolean {
  return completions.some((c) => c.labId === labId);
}

export function getStreak(attempts: Attempt[]): number {
  const days = new Set(
    attempts.filter((a) => a.passed).map((a) => toDateKey(a.at))
  );
  if (days.size === 0) return 0;

  // Anchor: start from today; if today has no activity, start from yesterday
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (!days.has(toDateKey(start.getTime()))) {
    start.setDate(start.getDate() - 1);
  }
  // If neither today nor yesterday has activity, streak is 0
  if (!days.has(toDateKey(start.getTime()))) return 0;

  let count = 0;
  const cursor = new Date(start);
  for (let i = 0; i < 365; i++) {
    if (!days.has(toDateKey(cursor.getTime()))) break;
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function getActivityDays(attempts: Attempt[]): string[] {
  const days = new Set(
    attempts.filter((a) => a.passed).map((a) => toDateKey(a.at))
  );
  return Array.from(days);
}

const PHASE_A_IDS = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"];

export function getCkaReadiness(completions: Completion[]): number {
  const done = new Set(completions.map((c) => c.labId));
  const phaseADone = PHASE_A_IDS.filter((id) => done.has(id)).length;
  // Phase A covers 25% of CKA readiness; B+C cover the remaining 75%
  return Math.round((phaseADone / PHASE_A_IDS.length) * 25);
}

export function getEksReadiness(_completions: Completion[]): number {
  return 0; // Phase D not yet implemented
}
