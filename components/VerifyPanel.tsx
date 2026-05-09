"use client";

import type { ObjectiveResult } from "@/lib/verifiers/types";

interface Props {
  results: ObjectiveResult[] | null;
  isVerifying: boolean;
  onVerify: () => void;
  onRevealSolution: () => void;
  failCount: number;
  hints: { revealAfterMs?: number; text: string }[];
  elapsedMs: number;
}

export function VerifyPanel({
  results,
  isVerifying,
  onVerify,
  onRevealSolution,
  failCount,
  hints,
  elapsedMs,
}: Props) {
  const passed = results?.every((r) => r.passed) ?? false;
  const visibleHints = hints.filter((h) => !h.revealAfterMs || elapsedMs >= h.revealAfterMs);

  return (
    <div className="flex flex-col gap-3">
      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onVerify}
          disabled={isVerifying}
          className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {isVerifying ? "Verifying…" : "Verify  ⌘↵"}
        </button>

        {failCount >= 3 && (
          <button
            onClick={onRevealSolution}
            className="rounded-lg border border-surface-600 px-4 py-2 text-sm text-gray-400 hover:bg-surface-700 transition-colors"
          >
            Reveal solution
          </button>
        )}

        {passed && (
          <span className="text-sm font-semibold text-green-400">✓ All objectives passed!</span>
        )}
      </div>

      {/* Objectives checklist */}
      {results && (
        <div className="rounded-xl border border-surface-600 bg-surface-800 divide-y divide-surface-700">
          {results.map((r) => (
            <div key={r.id} className="flex items-start gap-3 px-4 py-3">
              <span className={`mt-0.5 text-base ${r.passed ? "text-green-400" : "text-red-400"}`}>
                {r.passed ? "✓" : "✗"}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${r.passed ? "text-gray-300" : "text-white"}`}>
                  {r.description}
                </p>
                {!r.passed && r.hint && (
                  <p className="mt-1 text-xs text-amber-400">↳ {r.hint}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timed hints */}
      {visibleHints.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hints</p>
          {visibleHints.map((h, i) => (
            <div key={i} className="rounded-lg border border-amber-600/30 bg-amber-600/10 px-3 py-2 text-xs text-amber-300">
              {h.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
