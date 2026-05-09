"use client";

import { useState } from "react";
import { useProgressStore } from "@/lib/progress-store";

const SHORTCUTS = [
  { keys: "⌘ / Ctrl + Enter", action: "Verify lab solution" },
  { keys: "⌘ / Ctrl + S", action: "Save YAML (triggers auto-apply)" },
];

export default function SettingsPage() {
  const [confirmed, setConfirmed] = useState(false);

  function handleReset() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    useProgressStore.persist.clearStorage();
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-gray-400">App preferences and data management.</p>
      </div>

      {/* Keyboard shortcuts */}
      <div className="rounded-xl border border-surface-600 bg-surface-800 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Keyboard Shortcuts
        </h2>
        <div className="space-y-3">
          {SHORTCUTS.map(({ keys, action }) => (
            <div key={action} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{action}</span>
              <kbd className="rounded bg-surface-700 px-2.5 py-1 text-xs font-mono text-gray-300 border border-surface-600">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Storage info */}
      <div className="rounded-xl border border-surface-600 bg-surface-800 p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Progress Storage
        </h2>
        <p className="text-sm text-gray-400">
          Progress (completed labs, attempts, streak) is stored in your browser&apos;s{" "}
          <code className="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-teal-400">
            localStorage
          </code>
          . It persists across page refreshes but is local to this browser — clearing site data or
          using a different browser will start fresh.
        </p>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-800/50 bg-red-900/10 p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-400">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-300">Reset all progress</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently deletes all completed labs, attempts, and streak data.
            </p>
          </div>
          <button
            onClick={handleReset}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              confirmed
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-red-800/60 text-red-400 hover:bg-red-900/30"
            }`}
          >
            {confirmed ? "Yes, reset everything" : "Reset progress"}
          </button>
        </div>
        {confirmed && (
          <p className="mt-3 text-xs text-red-400">
            Click again to confirm — this cannot be undone.{" "}
            <button
              onClick={() => setConfirmed(false)}
              className="underline hover:no-underline"
            >
              Cancel
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
