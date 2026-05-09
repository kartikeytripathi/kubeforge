import Link from "next/link";

type Lesson = { id: string; title: string; status: "available" | "locked"; boss?: boolean; href?: string };
type Phase = { id: string; title: string; lessons: Lesson[] };

export default function CurriculumPage() {
  const phases: Phase[] = [
    {
      id: "A",
      title: "Phase A — Foundations (Vanilla K8s)",
      lessons: [
        { id: "A1", title: "Pods, containers, restartPolicy", status: "available", href: "/lesson/a1" },
        { id: "A2", title: "ReplicaSets and Deployments", status: "available", href: "/lesson/a2" },
        { id: "A3", title: "Services: ClusterIP, NodePort, LoadBalancer", status: "available", href: "/lesson/a3" },
        { id: "A4", title: "ConfigMaps and Secrets", status: "locked" },
        { id: "A5", title: "Volumes, PV, PVC, StorageClasses", status: "locked" },
        { id: "A6", title: "Namespaces and labels/selectors", status: "locked" },
        { id: "A7", title: "kubectl mastery", status: "locked" },
        { id: "A8", title: "Boss Lab — Deploy a 3-tier app", status: "locked", boss: true },
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

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-bold text-white">Curriculum</h1>
        <p className="mt-1 text-gray-400">
          38 labs across 4 phases. Labs unlock in order — complete each to progress.
        </p>
      </div>

      {phases.map((phase) => (
        <section key={phase.id} className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-200">{phase.title}</h2>
          <div className="rounded-xl border border-surface-600 bg-surface-800 divide-y divide-surface-700">
            {phase.lessons.map((lesson) => {
              const available = lesson.status === "available" && !!lesson.href;
              const inner = (
                <>
                  <span className="w-8 text-xs font-mono text-gray-500">{lesson.id}</span>
                  <span className="flex-1 text-sm text-gray-300">{lesson.title}</span>
                  {lesson.boss && (
                    <span className="rounded-full bg-amber-600/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
                      Boss Lab
                    </span>
                  )}
                  {available ? (
                    <span className="text-xs text-teal-500">Start →</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </>
              );
              return available ? (
                <Link
                  key={lesson.id}
                  href={lesson.href!}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-700 cursor-pointer transition-colors"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 px-4 py-3 opacity-50 cursor-not-allowed"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="text-xs text-gray-600">Labs unlock progressively in Phase 1+.</p>
    </div>
  );
}
