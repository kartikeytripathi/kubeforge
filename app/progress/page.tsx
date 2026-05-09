export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <div>
        <h1 className="text-3xl font-bold text-white">Progress</h1>
        <p className="mt-1 text-gray-400">Your CKA and EKS readiness at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-surface-600 bg-surface-800 p-6">
          <p className="text-sm text-gray-400">CKA Readiness</p>
          <p className="mt-2 text-5xl font-bold text-teal-400">0%</p>
          <p className="mt-2 text-xs text-gray-500">Complete Phase A labs to begin.</p>
        </div>
        <div className="rounded-xl border border-surface-600 bg-surface-800 p-6">
          <p className="text-sm text-gray-400">EKS Readiness</p>
          <p className="mt-2 text-5xl font-bold text-blue-400">0%</p>
          <p className="mt-2 text-xs text-gray-500">Enable EKS mode to unlock Phase D.</p>
        </div>
      </div>

      {/* TODO(phase-2): render real attempt history from SQLite */}
      <div className="rounded-xl border border-surface-600 bg-surface-800 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Recent Attempts
        </h2>
        <p className="text-sm text-gray-500">No attempts yet. Start a lab in the Curriculum.</p>
      </div>
    </div>
  );
}
