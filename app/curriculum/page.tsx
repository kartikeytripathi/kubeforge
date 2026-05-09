"use client";

import Link from "next/link";
import { useProgressStore } from "@/lib/progress-store";

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
      { id: "B1", title: "Probes (liveness, readiness, startup)", status: "locked" },
      { id: "B2", title: "Resource requests, limits, QoS classes", status: "locked" },
      { id: "B3", title: "Affinity, anti-affinity, topology spread", status: "locked" },
      { id: "B4", title: "Taints and tolerations", status: "locked" },
      { id: "B5", title: "StatefulSets, headless services", status: "locked" },
      { id: "B6", title: "DaemonSets, Jobs, CronJobs", status: "locked" },
      { id: "B7", title: "Ingress, NetworkPolicy", status: "locked" },
      { id: "B8", title: "RBAC, ServiceAccounts", status: "locked" },
      { id: "B9", title: "HPA and VPA", status: "locked" },
      { id: "B10", title: "Boss Lab — DiskPressure incident", status: "locked", boss: true },
    ],
  },
  {
    id: "C",
    title: "Phase C — Advanced K8s",
    lessons: [
      { id: "C1", title: "CRDs and the operator pattern", status: "locked" },
      { id: "C2", title: "Admission webhooks", status: "locked" },
      { id: "C3", title: "Scheduler internals", status: "locked" },
      { id: "C4", title: "Controller reconciliation", status: "locked" },
      { id: "C5", title: "Service mesh basics (Istio)", status: "locked" },
      { id: "C6", title: "GitOps with ArgoCD", status: "locked" },
      { id: "C7", title: "Pod Security Standards, OPA/Kyverno", status: "locked" },
      { id: "C8", title: "Backup/DR with Velero", status: "locked" },
      { id: "C9", title: "Boss Lab — ArgoCD repo-server bottleneck", status: "locked", boss: true },
    ],
  },
  {
    id: "D",
    title: "Phase D — EKS Deep Track",
    lessons: [
      { id: "D1", title: "EKS architecture: control plane, data plane choices", status: "locked" },
      { id: "D2", title: "VPC CNI internals", status: "locked" },
      { id: "D3", title: "IRSA and Pod Identity", status: "locked" },
      { id: "D4", title: "AWS Load Balancer Controller", status: "locked" },
      { id: "D5", title: "Karpenter", status: "locked" },
      { id: "D6", title: "EKS Auto Mode", status: "locked" },
      { id: "D7", title: "EKS add-ons and version upgrades", status: "locked" },
      { id: "D8", title: "Cross-account ECR", status: "locked" },
      { id: "D9", title: "ECR lifecycle policies", status: "locked" },
      { id: "D10", title: "EKS observability — kubelet volume metrics", status: "locked" },
      { id: "D11", title: "EKS Fargate specifics", status: "locked" },
      { id: "D12", title: "Cost optimization", status: "locked" },
      { id: "D13", title: "Capstone — ShopEKS revival", status: "locked", boss: true },
    ],
  },
];

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4L6.5 11 3 7.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

export default function CurriculumPage() {
  const isCompleted = useProgressStore((s) => s.isCompleted);
  const attempts = useProgressStore((s) => s.attempts);
  const completedLabIds = useProgressStore((s) => s.completedLabIds());

  const phaseADone = completedLabIds.filter((id) => id.startsWith("a")).length;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Curriculum</h1>
          <p className="mt-1 text-gray-400">
            38 labs across 4 phases. Complete each lab to unlock the next.
          </p>
        </div>
        {phaseADone > 0 && (
          <span className="text-sm text-teal-400 font-medium">
            {phaseADone}/8 Phase A complete
          </span>
        )}
      </div>

      {PHASES.map((phase) => (
        <section key={phase.id} className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-200">{phase.title}</h2>
          <div className="rounded-xl border border-surface-600 bg-surface-800 divide-y divide-surface-700">
            {phase.lessons.map((lesson) => {
              const available = lesson.status === "available" && !!lesson.href;
              const labId = lesson.id.toLowerCase();
              const done = available && isCompleted(labId);
              const tried = available && !done && attempts.some((a) => a.labId === labId);

              const row = (
                <>
                  {/* Completion indicator */}
                  <span className="w-5 shrink-0 flex items-center justify-center">
                    {done ? (
                      <span className="text-teal-400"><CheckIcon /></span>
                    ) : tried ? (
                      <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                    ) : null}
                  </span>

                  <span className="w-8 text-xs font-mono text-gray-500">{lesson.id}</span>
                  <span className={`flex-1 text-sm ${done ? "text-teal-300" : "text-gray-300"}`}>
                    {lesson.title}
                  </span>

                  {lesson.boss && (
                    <span className="rounded-full bg-amber-600/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
                      Boss Lab
                    </span>
                  )}

                  {done ? (
                    <span className="rounded-full bg-teal-600/20 px-2.5 py-0.5 text-xs font-semibold text-teal-400">
                      Completed
                    </span>
                  ) : tried ? (
                    <span className="text-xs text-amber-500">In progress</span>
                  ) : available ? (
                    <span className="text-xs text-gray-500">Start →</span>
                  ) : (
                    <LockIcon />
                  )}
                </>
              );

              return available ? (
                <Link
                  key={lesson.id}
                  href={lesson.href!}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    done ? "hover:bg-teal-900/20" : "hover:bg-surface-700"
                  }`}
                >
                  {row}
                </Link>
              ) : (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 px-4 py-3 opacity-40 cursor-not-allowed"
                >
                  {row}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
