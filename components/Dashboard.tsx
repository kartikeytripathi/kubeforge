"use client";

import Link from "next/link";
import {
  useProgressStore,
  getCompletedLabIds,
  getStreak,
  getActivityDays,
  getCkaReadiness,
  getEksReadiness,
} from "@/lib/progress-store";

const LAB_ORDER = [
  "a1","a2","a3","a4","a5","a6","a7","a8",
  "b1","b2","b3","b4","b5","b6","b7","b8","b9","b10",
  "c1","c2","c3","c4","c5","c6","c7","c8","c9",
  "d1","d2","d3","d4","d5","d6","d7","d8","d9","d10","d11","d12","d13",
];

export function Dashboard() {
  const completions = useProgressStore((s) => s.completions);
  const attempts = useProgressStore((s) => s.attempts);

  const completedLabIds = getCompletedLabIds(completions);
  const completedSet = new Set(completedLabIds);
  const nextLab = LAB_ORDER.find((id) => !completedSet.has(id)) ?? "a1";
  const streak = getStreak(attempts);
  const activityDays = getActivityDays(attempts);
  const ckaReadiness = getCkaReadiness(completions);
  const eksReadiness = getEksReadiness(completions);

  const activitySet = new Set(activityDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const heatmapDays = Array.from({ length: 364 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (363 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-10 py-8">
      <section className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Welcome to <span className="text-teal-600">KubeForge</span>
        </h1>
        <p className="text-lg text-gray-400">
          Hands-on Kubernetes &amp; EKS learning. Every concept has a lab.
          Every lab has automated verification.
        </p>
      </section>

      <section className="grid grid-cols-3 gap-4">
        {[
          { label: "CKA Readiness", value: `${ckaReadiness}%`, color: "text-teal-400" },
          { label: "EKS Readiness", value: `${eksReadiness}%`, color: "text-blue-400" },
          { label: "Current Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-surface-600 bg-surface-800 p-5">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      {completedLabIds.length > 0 && (
        <section className="rounded-xl border border-surface-600 bg-surface-800 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Completed Labs ({completedLabIds.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {completedLabIds.map((id) => (
              <span key={id} className="rounded-full bg-teal-600/20 px-3 py-1 text-xs font-semibold text-teal-400">
                {id.toUpperCase()}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-surface-600 bg-surface-800 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Activity — last 52 weeks
        </h2>
        <div className="grid grid-cols-[repeat(52,1fr)] gap-1">
          {heatmapDays.map((day) => (
            <div
              key={day}
              title={day}
              className={`aspect-square w-full rounded-sm ${activitySet.has(day) ? "bg-teal-500" : "bg-surface-700"}`}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {attempts.length > 0
            ? `${attempts.length} attempt${attempts.length !== 1 ? "s" : ""} across ${completedLabIds.length} completed lab${completedLabIds.length !== 1 ? "s" : ""}.`
            : "Start a lab to begin tracking your progress."}
        </p>
      </section>

      <section className="flex gap-4">
        <Link
          href="/curriculum"
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          Browse Curriculum
        </Link>
        <Link
          href={`/lesson/${nextLab}`}
          className="rounded-lg border border-surface-600 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-surface-700 transition-colors"
        >
          {completedLabIds.length > 0 ? `Continue → ${nextLab.toUpperCase()}` : "Start Lab A1 →"}
        </Link>
      </section>
    </div>
  );
}
