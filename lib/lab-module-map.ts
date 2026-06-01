// Auto-derived from content/lab-mapping.csv
// One entry per lab — links to the most directly relevant module section.
// Module guide URLs point to the GitHub-hosted guide.md for each module.

export type ModuleLink = {
  moduleNum: number;
  moduleTitle: string;
  section: string;
  anchor: string;
  linkText: string;
  guideUrl: string;
};

const BASE =
  "https://github.com/kartikeytripathi/kubeforge/blob/main/modules";

function url(mod: string, anchor: string) {
  return `${BASE}/${mod}/guide.md#${anchor}`;
}

// Primary (first) link per lab — shown as the "Why this works →" footer.
export const LAB_MODULE_MAP: Record<string, ModuleLink> = {
  a1: {
    moduleNum: 1, moduleTitle: "API Request Lifecycle",
    section: "Kubelet & the final mile",
    anchor: "kubelet--the-final-mile",
    linkText: "Why kubectl apply triggers a CrashLoopBackOff →",
    guideUrl: url("01-api-request-lifecycle", "kubelet--the-final-mile"),
  },
  a2: {
    moduleNum: 1, moduleTitle: "API Request Lifecycle",
    section: "The API server request pipeline",
    anchor: "the-api-server-request-pipeline",
    linkText: "How kubectl apply reaches the cluster →",
    guideUrl: url("01-api-request-lifecycle", "the-api-server-request-pipeline"),
  },
  a3: {
    moduleNum: 9, moduleTitle: "Networking Internals & kube-proxy Modes",
    section: "kube-proxy and iptables rules",
    anchor: "kube-proxy-and-iptables-rules",
    linkText: "How Services route traffic between pods →",
    guideUrl: url("09-networking-internals", "kube-proxy-and-iptables-rules"),
  },
  a4: {
    moduleNum: 2, moduleTitle: "etcd & the Storage Layer",
    section: "Key structure and protobuf encoding",
    anchor: "the-etcd-data-model-inside-kubernetes",
    linkText: "How ConfigMaps and Secrets are stored in etcd →",
    guideUrl: url("02-etcd-storage", "the-etcd-data-model-inside-kubernetes"),
  },
  a5: {
    moduleNum: 6, moduleTitle: "CRI, CNI, CSI — The Three Interfaces",
    section: "CSI — Container Storage Interface",
    anchor: "csi--container-storage-interface",
    linkText: "How PVCs bind to storage via CSI →",
    guideUrl: url("06-cri-cni-csi", "csi--container-storage-interface"),
  },
  a6: {
    moduleNum: 1, moduleTitle: "API Request Lifecycle",
    section: "Authorization — RBAC and beyond",
    anchor: "authorization--rbac-and-beyond",
    linkText: "How namespace isolation is enforced at the API level →",
    guideUrl: url("01-api-request-lifecycle", "authorization--rbac-and-beyond"),
  },
  a7: {
    moduleNum: 1, moduleTitle: "API Request Lifecycle",
    section: "The API server request pipeline",
    anchor: "the-api-server-request-pipeline",
    linkText: "How multi-document YAML is applied through the API →",
    guideUrl: url("01-api-request-lifecycle", "the-api-server-request-pipeline"),
  },
  a8: {
    moduleNum: 1, moduleTitle: "API Request Lifecycle",
    section: "The API server request pipeline",
    anchor: "the-api-server-request-pipeline",
    linkText: "How the API server processes all your fix commands →",
    guideUrl: url("01-api-request-lifecycle", "the-api-server-request-pipeline"),
  },
  b1: {
    moduleNum: 5, moduleTitle: "Kubelet, PLEG & Node Lifecycle",
    section: "Liveness, readiness and startup probes",
    anchor: "liveness-readiness-and-startup-probes",
    linkText: "Why liveness probes trigger pod restarts →",
    guideUrl: url("05-kubelet-pleg", "liveness-readiness-and-startup-probes"),
  },
  b2: {
    moduleNum: 4, moduleTitle: "Scheduler Internals & Custom Plugins",
    section: "The scheduling cycle — filter and score",
    anchor: "the-scheduling-cycle--filter-and-score",
    linkText: "Why resource requests block scheduling →",
    guideUrl: url("04-scheduler-internals", "the-scheduling-cycle--filter-and-score"),
  },
  b3: {
    moduleNum: 4, moduleTitle: "Scheduler Internals & Custom Plugins",
    section: "Taints, tolerations and node affinity",
    anchor: "taints-tolerations-and-node-affinity",
    linkText: "How taints and tolerations influence the scheduler →",
    guideUrl: url("04-scheduler-internals", "taints-tolerations-and-node-affinity"),
  },
  b4: {
    moduleNum: 3, moduleTitle: "Controllers & Reconciliation",
    section: "StatefulSet controller and ordinal guarantees",
    anchor: "statefulset-controller-and-ordinal-guarantees",
    linkText: "Why StatefulSet pods keep their identity →",
    guideUrl: url("03-controllers-reconciliation", "statefulset-controller-and-ordinal-guarantees"),
  },
  b5: {
    moduleNum: 5, moduleTitle: "Kubelet, PLEG & Node Lifecycle",
    section: "Node registration and DaemonSet scheduling",
    anchor: "node-registration-and-daemonset-scheduling",
    linkText: "How DaemonSets track node lifecycle events →",
    guideUrl: url("05-kubelet-pleg", "node-registration-and-daemonset-scheduling"),
  },
  b6: {
    moduleNum: 3, moduleTitle: "Controllers & Reconciliation",
    section: "Job and CronJob controllers",
    anchor: "job-and-cronjob-controllers",
    linkText: "How the Job controller manages completions →",
    guideUrl: url("03-controllers-reconciliation", "job-and-cronjob-controllers"),
  },
  b7: {
    moduleNum: 9, moduleTitle: "Networking Internals & kube-proxy Modes",
    section: "Ingress controllers and traffic routing",
    anchor: "ingress-controllers-and-traffic-routing",
    linkText: "How Ingress controllers route external traffic →",
    guideUrl: url("09-networking-internals", "ingress-controllers-and-traffic-routing"),
  },
  b8: {
    moduleNum: 1, moduleTitle: "API Request Lifecycle",
    section: "Authorization — RBAC and beyond",
    anchor: "authorization--rbac-and-beyond",
    linkText: "How RBAC gates every API request →",
    guideUrl: url("01-api-request-lifecycle", "authorization--rbac-and-beyond"),
  },
  b9: {
    moduleNum: 3, moduleTitle: "Controllers & Reconciliation",
    section: "HPA controller and metrics pipeline",
    anchor: "hpa-controller-and-metrics-pipeline",
    linkText: "How the HPA controller reads metrics and triggers scaling →",
    guideUrl: url("03-controllers-reconciliation", "hpa-controller-and-metrics-pipeline"),
  },
  b10: {
    moduleNum: 5, moduleTitle: "Kubelet, PLEG & Node Lifecycle",
    section: "PLEG and node lifecycle events",
    anchor: "pleg-and-node-lifecycle-events",
    linkText: "How kubelet detects and responds to pod failures →",
    guideUrl: url("05-kubelet-pleg", "pleg-and-node-lifecycle-events"),
  },
  c1: {
    moduleNum: 8, moduleTitle: "CRDs, Operators & controller-runtime",
    section: "CRD registration and the extension API server",
    anchor: "crd-registration-and-the-extension-api-server",
    linkText: "How CRDs extend the Kubernetes API →",
    guideUrl: url("08-crds-operators", "crd-registration-and-the-extension-api-server"),
  },
  c2: {
    moduleNum: 7, moduleTitle: "Admission Control & CEL Policy",
    section: "Validating admission webhooks",
    anchor: "validating-admission-webhooks",
    linkText: "How admission webhooks intercept and reject API requests →",
    guideUrl: url("07-admission-control", "validating-admission-webhooks"),
  },
  c3: {
    moduleNum: 4, moduleTitle: "Scheduler Internals & Custom Plugins",
    section: "The scheduling cycle — filter and score",
    anchor: "the-scheduling-cycle--filter-and-score",
    linkText: "Why nodeSelector mismatches leave pods Pending forever →",
    guideUrl: url("04-scheduler-internals", "the-scheduling-cycle--filter-and-score"),
  },
  c4: {
    moduleNum: 3, moduleTitle: "Controllers & Reconciliation",
    section: "The reconcile loop pattern",
    anchor: "the-reconcile-loop-pattern",
    linkText: "How controllers watch etcd and drive desired state →",
    guideUrl: url("03-controllers-reconciliation", "the-reconcile-loop-pattern"),
  },
  c5: {
    moduleNum: 9, moduleTitle: "Networking Internals & kube-proxy Modes",
    section: "Service mesh and eBPF datapath",
    anchor: "service-mesh-and-ebpf-datapath",
    linkText: "How Istio intercepts pod traffic for mTLS →",
    guideUrl: url("09-networking-internals", "service-mesh-and-ebpf-datapath"),
  },
  c6: {
    moduleNum: 3, moduleTitle: "Controllers & Reconciliation",
    section: "The reconcile loop pattern",
    anchor: "the-reconcile-loop-pattern",
    linkText: "Why runaway reconcile loops exhaust external APIs →",
    guideUrl: url("03-controllers-reconciliation", "the-reconcile-loop-pattern"),
  },
  c7: {
    moduleNum: 7, moduleTitle: "Admission Control & CEL Policy",
    section: "Policy engines — OPA, Kyverno and CEL",
    anchor: "policy-engines--opa-kyverno-and-cel",
    linkText: "How Kyverno enforces policy at admission time →",
    guideUrl: url("07-admission-control", "policy-engines--opa-kyverno-and-cel"),
  },
  c8: {
    moduleNum: 6, moduleTitle: "CRI, CNI, CSI — The Three Interfaces",
    section: "CSI — Container Storage Interface",
    anchor: "csi--container-storage-interface",
    linkText: "How Velero snapshots storage via CSI hooks →",
    guideUrl: url("06-cri-cni-csi", "csi--container-storage-interface"),
  },
  c9: {
    moduleNum: 3, moduleTitle: "Controllers & Reconciliation",
    section: "The reconcile loop pattern",
    anchor: "the-reconcile-loop-pattern",
    linkText: "How controller throughput affects cluster convergence →",
    guideUrl: url("03-controllers-reconciliation", "the-reconcile-loop-pattern"),
  },
  d1: {
    moduleNum: 4, moduleTitle: "Scheduler Internals & Custom Plugins",
    section: "Karpenter — scheduling without the scheduler",
    anchor: "karpenter--scheduling-without-the-scheduler",
    linkText: "How Karpenter bypasses kube-scheduler for node provisioning →",
    guideUrl: url("04-scheduler-internals", "karpenter--scheduling-without-the-scheduler"),
  },
  d2: {
    moduleNum: 6, moduleTitle: "CRI, CNI, CSI — The Three Interfaces",
    section: "CNI — Container Network Interface",
    anchor: "cni--container-network-interface",
    linkText: "How VPC CNI assigns IPs to pods on EKS →",
    guideUrl: url("06-cri-cni-csi", "cni--container-network-interface"),
  },
  d3: {
    moduleNum: 1, moduleTitle: "API Request Lifecycle",
    section: "Authentication — who are you?",
    anchor: "authentication--who-are-you",
    linkText: "How pod identity maps to AWS IAM credentials →",
    guideUrl: url("01-api-request-lifecycle", "authentication--who-are-you"),
  },
  d4: {
    moduleNum: 9, moduleTitle: "Networking Internals & kube-proxy Modes",
    section: "Ingress controllers and traffic routing",
    anchor: "ingress-controllers-and-traffic-routing",
    linkText: "How the AWS LBC translates Ingress objects to ALB rules →",
    guideUrl: url("09-networking-internals", "ingress-controllers-and-traffic-routing"),
  },
  d5: {
    moduleNum: 4, moduleTitle: "Scheduler Internals & Custom Plugins",
    section: "Karpenter — scheduling without the scheduler",
    anchor: "karpenter--scheduling-without-the-scheduler",
    linkText: "Why Karpenter's scoring model triggers consolidation →",
    guideUrl: url("04-scheduler-internals", "karpenter--scheduling-without-the-scheduler"),
  },
  d6: {
    moduleNum: 8, moduleTitle: "CRDs, Operators & controller-runtime",
    section: "CRD registration and the extension API server",
    anchor: "crd-registration-and-the-extension-api-server",
    linkText: "How NodeClass CRDs configure EKS Auto Mode →",
    guideUrl: url("08-crds-operators", "crd-registration-and-the-extension-api-server"),
  },
  d7: {
    moduleNum: 10, moduleTitle: "HA, Upgrades & Cluster Lifecycle",
    section: "Cluster upgrades and node draining",
    anchor: "cluster-upgrades-and-node-draining",
    linkText: "How PDBs protect pods during node drain →",
    guideUrl: url("10-ha-upgrades", "cluster-upgrades-and-node-draining"),
  },
  d8: {
    moduleNum: 1, moduleTitle: "API Request Lifecycle",
    section: "Authentication — who are you?",
    anchor: "authentication--who-are-you",
    linkText: "How ECR image pulls authenticate at the API level →",
    guideUrl: url("01-api-request-lifecycle", "authentication--who-are-you"),
  },
  d9: {
    moduleNum: 6, moduleTitle: "CRI, CNI, CSI — The Three Interfaces",
    section: "CRI — Container Runtime Interface",
    anchor: "cri--container-runtime-interface",
    linkText: "How the CRI pulls images and resolves multi-arch manifests →",
    guideUrl: url("06-cri-cni-csi", "cri--container-runtime-interface"),
  },
  d10: {
    moduleNum: 5, moduleTitle: "Kubelet, PLEG & Node Lifecycle",
    section: "Kubelet metrics and the metrics pipeline",
    anchor: "kubelet-metrics-and-the-metrics-pipeline",
    linkText: "How kubelet exposes volume metrics to the metrics server →",
    guideUrl: url("05-kubelet-pleg", "kubelet-metrics-and-the-metrics-pipeline"),
  },
  d11: {
    moduleNum: 5, moduleTitle: "Kubelet, PLEG & Node Lifecycle",
    section: "Node registration and DaemonSet scheduling",
    anchor: "node-registration-and-daemonset-scheduling",
    linkText: "How Fargate virtual nodes differ from EC2 kubelet nodes →",
    guideUrl: url("05-kubelet-pleg", "node-registration-and-daemonset-scheduling"),
  },
  d12: {
    moduleNum: 4, moduleTitle: "Scheduler Internals & Custom Plugins",
    section: "Karpenter — scheduling without the scheduler",
    anchor: "karpenter--scheduling-without-the-scheduler",
    linkText: "How Karpenter's consolidation loop evaluates Spot interruptions →",
    guideUrl: url("04-scheduler-internals", "karpenter--scheduling-without-the-scheduler"),
  },
  d13: {
    moduleNum: 1, moduleTitle: "API Request Lifecycle",
    section: "The API server request pipeline",
    anchor: "the-api-server-request-pipeline",
    linkText: "How every fix you apply flows through the K8s API →",
    guideUrl: url("01-api-request-lifecycle", "the-api-server-request-pipeline"),
  },
};

// Labs that link to Module 2 (etcd) — guide is live in the repo
const MODULE_2_LIVE = new Set(["a4", "b4", "c4"]);

// Returns true if the guide for this lab's module is published in the repo
export function isModuleLive(labId: string): boolean {
  return MODULE_2_LIVE.has(labId);
}
