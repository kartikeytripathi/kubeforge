"use client";

import Link from "next/link";
import { useProgressStore, isLabCompleted } from "@/lib/progress-store";

type Lesson = { id: string; title: string; status: "available" | "locked"; boss?: boolean; href?: string };
type Phase = { id: string; title: string; lessons: Lesson[] };

const PHASES: Phase[] = [
  {
    id: "A",
    title: "Phase A — Foundations (Vanilla K8s)",
    lessons: [
      { id: "A1", title: "Pods, containers, restartPolicy", status: "available", href: "/lesson/a1" },
      { id: "A2", title: "ReplicaSets and Deployments", status: "available", href: "/lesson/a2" },
      { id: "A3", title: "Services: ClusterIP, NodePort, LoadBalancer", status: "available", href: "/lesson/a3" },
      { id: "A4", title: "ConfigMaps and Secrets", status: "available", href: "/lesson/a4" },
      { id: "A5", title: "Volumes, PV, PVC, StorageClasses", status: "available", href: "/lesson/a5" },
      { id: "A6", title: "Namespaces and labels/selectors", status: "available", href: "/lesson/a6" },
      { id: "A7", title: "Multi-resource stacks", status: "available", href: "/lesson/a7" },
      { id: "A8", title: "Boss Lab — Production incident", status: "available", href: "/lesson/a8", boss: true },
    ],
  },
  {
    id: "B",
    title: "Phase B — Production K8s",
    lessons: [
      { id: "B1", title: "Liveness, Readiness & Startup Probes", status: "available", href: "/lesson/b1" },
      { id: "B2", title: "Resource Requests & Limits", status: "available", href: "/lesson/b2" },
      { id: "B3", title: "Taints & Tolerations", status: "available", href: "/lesson/b3" },
      { id: "B4", title: "StatefulSets & Stable Identity", status: "available", href: "/lesson/b4" },
      { id: "B5", title: "DaemonSets", status: "available", href: "/lesson/b5" },
      { id: "B6", title: "Jobs & CronJobs", status: "available", href: "/lesson/b6" },
      { id: "B7", title: "Ingress", status: "available", href: "/lesson/b7" },
      { id: "B8", title: "RBAC: ServiceAccounts, Roles, RoleBindings", status: "available", href: "/lesson/b8" },
      { id: "B9", title: "HorizontalPodAutoscaler", status: "available", href: "/lesson/b9" },
      { id: "B10", title: "Boss Lab — Three production failures", status: "available", href: "/lesson/b10", boss: true },
    ],
  },
  {
    id: "C",
    title: "Phase C — Advanced K8s",
    lessons: [
      { id: "C1", title: "CRDs and the operator pattern", status: "available", href: "/lesson/c1" },
      { id: "C2", title: "Admission webhooks", status: "available", href: "/lesson/c2" },
      { id: "C3", title: "Scheduler internals", status: "available", href: "/lesson/c3" },
      { id: "C4", title: "Controller reconciliation", status: "available", href: "/lesson/c4" },
      { id: "C5", title: "Service mesh basics (Istio)", status: "available", href: "/lesson/c5" },
      { id: "C6", title: "GitOps with ArgoCD", status: "available", href: "/lesson/c6" },
      { id: "C7", title: "Pod Security Standards, OPA/Kyverno", status: "available", href: "/lesson/c7" },
      { id: "C8", title: "Backup/DR with Velero", status: "available", href: "/lesson/c8" },
      { id: "C9", title: "Boss Lab — ArgoCD repo-server bottleneck", status: "available", href: "/lesson/c9", boss: true },
    ],
  },
  {
    id: "D",
    title: "Phase D — EKS Deep Track",
    lessons: [
      { id: "D1", title: "EKS architecture: control plane, data plane choices", status: "available", href: "/lesson/d1" },
      { id: "D2", title: "VPC CNI internals", status: "available", href: "/lesson/d2" },
      { id: "D3", title: "IRSA and Pod Identity", status: "available", href: "/lesson/d3" },
      { id: "D4", title: "AWS Load Balancer Controller", status: "available", href: "/lesson/d4" },
      { id: "D5", title: "Karpenter", status: "available", href: "/lesson/d5" },
      { id: "D6", title: "EKS Auto Mode", status: "available", href: "/lesson/d6" },
      { id: "D7", title: "EKS add-ons and version upgrades", status: "available", href: "/lesson/d7" },
      { id: "D8", title: "Cross-account ECR", status: "available", href: "/lesson/d8" },
      { id: "D9", title: "ECR lifecycle policies", status: "available", href: "/lesson/d9" },
      { id: "D10", title: "EKS observability — kubelet volume metrics", status: "available", href: "/lesson/d10" },
      { id: "D11", title: "EKS Fargate specifics", status: "available", href: "/lesson/d11" },
      { id: "D12", title: "Cost optimization", status: "available", href: "/lesson/d12" },
      { id: "D13", title: "Capstone — ShopEKS revival", status: "available", href: "/lesson/d13", boss: true },
    ],
  },
];

export default function CurriculumPage() {
  const completions = useProgressStore((s) => s.completions);
  const attempts = useProgressStore((s) => s.attempts);

  const totalDone = completions.length;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Curriculum</h1>
          <p className="mt-1 text-gray-400">38 labs across 4 phases.</p>
        </div>
        {totalDone > 0 && (
          <span className="text-sm text-teal-400 font-medium">{totalDone} lab{totalDone !== 1 ? "s" : ""} completed</span>
        )}
      </div>

      {PHASES.map((phase) => (
        <section key={phase.id} className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-200">{phase.title}</h2>
          <div className="rounded-xl border border-surface-600 bg-surface-800 divide-y divide-surface-700">
            {phase.lessons.map((lesson) => {
              const available = lesson.status === "available" && !!lesson.href;
              const labId = lesson.id.toLowerCase();
              const done = available && isLabCompleted(completions, labId);
              const tried = available && !done && attempts.some((a) => a.labId === labId);

              const row = (
                <>
                  <span className="w-5 shrink-0 flex items-center justify-center">
                    {done && (
                      <svg className="h-4 w-4 text-teal-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 4L6.5 11 3 7.5" />
                      </svg>
                    )}
                    {tried && !done && <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />}
                  </span>
                  <span className="w-8 text-xs font-mono text-gray-500">{lesson.id}</span>
                  <span className={`flex-1 text-sm ${done ? "text-teal-300" : "text-gray-300"}`}>{lesson.title}</span>
                  {lesson.boss && (
                    <span className="rounded-full bg-amber-600/20 px-2 py-0.5 text-xs font-semibold text-amber-400">Boss Lab</span>
                  )}
                  {done ? (
                    <span className="rounded-full bg-teal-600/20 px-2.5 py-0.5 text-xs font-semibold text-teal-400">Completed</span>
                  ) : tried ? (
                    <span className="text-xs text-amber-500">In progress</span>
                  ) : available ? (
                    <span className="text-xs text-gray-500">Start →</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </>
              );

              return available ? (
                <Link key={lesson.id} href={lesson.href!} className={`flex items-center gap-3 px-4 py-3 transition-colors ${done ? "hover:bg-teal-900/20" : "hover:bg-surface-700"}`}>
                  {row}
                </Link>
              ) : (
                <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 opacity-40 cursor-not-allowed">{row}</div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
