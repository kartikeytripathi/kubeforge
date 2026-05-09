export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-gray-400">App preferences and environment configuration.</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-surface-600 bg-surface-800 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Display
          </h2>
          {/* TODO(phase-6): theme toggle, font size */}
          <p className="text-sm text-gray-500">
            Dark mode is the default. Light mode toggle coming in Phase 6.
          </p>
        </div>

        <div className="rounded-xl border border-surface-600 bg-surface-800 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Cluster
          </h2>
          {/* TODO(phase-4): real cluster (kind) toggle */}
          <p className="text-sm text-gray-500">
            Simulated cluster only in Phases 0–3. Real{" "}
            <code className="rounded bg-surface-700 px-1 py-0.5 text-xs">kind</code> cluster
            option unlocks in Phase 4.
          </p>
        </div>

        <div className="rounded-xl border border-surface-600 bg-surface-800 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Keyboard Shortcuts
          </h2>
          <div className="space-y-2 text-sm">
            {[
              { keys: "⌘/Ctrl + Enter", action: "Verify lab solution" },
              { keys: "⌘/Ctrl + S", action: "Save attempt" },
              { keys: "[", action: "Previous lesson" },
              { keys: "]", action: "Next lesson" },
            ].map(({ keys, action }) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-gray-400">{action}</span>
                <kbd className="rounded bg-surface-700 px-2 py-0.5 text-xs font-mono text-gray-300">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
