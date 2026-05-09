import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 py-8">
      {/* Hero */}
      <section className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Welcome to{" "}
          <span className="text-teal-600">KubeForge</span>
        </h1>
        <p className="text-lg text-gray-400">
          Hands-on Kubernetes &amp; EKS learning. Every concept has a lab.
          Every lab has automated verification.
        </p>
      </section>

      {/* Quick stats — placeholder */}
      <section className="grid grid-cols-3 gap-4">
        {[
          { label: "CKA Readiness", value: "0%", color: "text-teal-400" },
          { label: "EKS Readiness", value: "0%", color: "text-blue-400" },
          { label: "Current Streak", value: "0 days", color: "text-amber-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-surface-600 bg-surface-800 p-5"
          >
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Activity heatmap placeholder */}
      <section className="rounded-xl border border-surface-600 bg-surface-800 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Activity — last 52 weeks
        </h2>
        {/* TODO(phase-2): render real SQLite-backed heatmap */}
        <div className="grid grid-cols-[repeat(52,1fr)] gap-1">
          {Array.from({ length: 364 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square w-full rounded-sm bg-surface-700"
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">Start a lab to begin tracking your progress.</p>
      </section>

      {/* Continue / start CTA */}
      <section className="flex gap-4">
        <Link
          href="/curriculum"
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          Browse Curriculum
        </Link>
        <Link
          href="/curriculum"
          className="rounded-lg border border-surface-600 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-surface-700 transition-colors"
        >
          Start Lab A1 →
        </Link>
      </section>

      {/* Phase indicator */}
      <p className="text-xs text-gray-600">
        Build Phase 0 — Scaffolding. Labs unlock in Phase 1.
      </p>
    </div>
  );
}
