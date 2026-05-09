"use client";

import Link from "next/link";
import { useProgressStore } from "@/lib/progress-store";

const PHASE_A_LABS = [
  { id: "a1", title: "Pods, containers, restartPolicy" },
  { id: "a2", title: "ReplicaSets and Deployments" },
  { id: "a3", title: "Services: ClusterIP, NodePort, LoadBalancer" },
  { id: "a4", title: "ConfigMaps and Secrets" },
  { id: "a5", title: "Volumes, PV, PVC, StorageClasses" },
  { id: "a6", title: "Namespaces and labels/selectors" },
  { id: "a7", title: "Multi-resource stacks" },
  { id: "a8", title: "Boss Lab — Production incident" },
];

export default function ProgressPage() {
  const completedLabIds = useProgressStore((s) => s.completedLabIds());
  const attempts = useProgressStore((s) => s.attempts);
  const completions = useProgressStore((s) => s.completions);
  const streak = useProgressStore((s) => s.streak());
  const ckaReadiness = useProgressStore((s) => s.ckaReadiness());
  const eksReadiness = useProgressStore((s) => s.eksReadiness());

  const recentAttempts = [...attempts]
    .sort((a, b) => b.at - a.at)
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-bold text-white">Progress</h1>
        <p className="mt-1 text-gray-400">Your CKA and EKS readiness at a glance.</p>
      </div>

      {/* Readiness + streak */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-surface-600 bg-surface-800 p-6">
          <p className="text-sm text-gray-400">CKA Readiness</p>
          <p className="mt-2 text-5xl font-bold text-teal-400">{ckaReadiness}%</p>
          <p className="mt-2 text-xs text-gray-500">
            {completedLabIds.filter((id) => id.startsWith("a")).length}/8 Phase A labs
          </p>
        </div>
        <div className="rounded-xl border border-surface-600 bg-surface-800 p-6">
          <p className="text-sm text-gray-400">EKS Readiness</p>
          <p className="mt-2 text-5xl font-bold text-blue-400">{eksReadiness}%</p>
          <p className="mt-2 text-xs text-gray-500">Phase D unlocks next</p>
        </div>
        <div className="rounded-xl border border-surface-600 bg-surface-800 p-6">
          <p className="text-sm text-gray-400">Current Streak</p>
          <p className="mt-2 text-5xl font-bold text-amber-400">{streak}</p>
          <p className="mt-2 text-xs text-gray-500">day{streak !== 1 ? "s" : ""} in a row</p>
        </div>
      </div>

      {/* Phase A lab grid */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Phase A — Foundations
        </h2>
        <div className="rounded-xl border border-surface-600 bg-surface-800 divide-y divide-surface-700">
          {PHASE_A_LABS.map((lab) => {
            const done = completedLabIds.includes(lab.id);
            const completion = completions.find((c) => c.labId === lab.id);
            const labAttempts = attempts.filter((a) => a.labId === lab.id);
            const tried = labAttempts.length > 0;

            return (
              <Link
                key={lab.id}
                href={`/lesson/${lab.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-700 transition-colors"
              >
                <span className="w-8 text-xs font-mono text-gray-500 uppercase">
                  {lab.id}
                </span>
                <span className="flex-1 text-sm text-gray-300">{lab.title}</span>

                {done ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-teal-600/20 px-2.5 py-0.5 text-xs font-semibold text-teal-400">
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Done
                    {completion && (
                      <span className="text-teal-600">
                        · {Math.round(completion.durationMs / 60000)}m
                      </span>
                    )}
                  </span>
                ) : tried ? (
                  <span className="rounded-full bg-amber-600/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                    In progress · {labAttempts.length} attempt{labAttempts.length !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">Not started</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent attempts */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Recent Attempts
        </h2>
        <div className="rounded-xl border border-surface-600 bg-surface-800 divide-y divide-surface-700">
          {recentAttempts.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-500">
              No attempts yet.{" "}
              <Link href="/curriculum" className="text-teal-400 hover:underline">
                Start a lab →
              </Link>
            </p>
          ) : (
            recentAttempts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    a.passed ? "bg-teal-400" : "bg-red-400"
                  }`}
                />
                <span className="w-10 text-xs font-mono text-gray-500 uppercase">
                  {a.labId}
                </span>
                <span className={`text-sm ${a.passed ? "text-teal-400" : "text-gray-400"}`}>
                  {a.passed ? "Passed" : "Failed"}
                </span>
                <span className="ml-auto text-xs text-gray-600">
                  {new Date(a.at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
