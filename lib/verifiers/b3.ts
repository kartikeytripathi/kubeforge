import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyB3(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];
  const pods = sim.getPods({ namespace: "default" });
  const pod = pods.find((p) => p.metadata.name === "gpu-job");

  results.push({
    id: "pod-exists",
    description: "Pod `gpu-job` exists in the `default` namespace",
    passed: !!pod,
    hint: !pod ? "Apply a Pod manifest with `metadata.name: gpu-job` in the `default` namespace." : undefined,
  });

  if (!pod) return results;

  const tolerations = pod.spec.tolerations ?? [];
  const hasToleration = tolerations.some(
    (t) => t.key === "dedicated" && t.value === "gpu" && t.effect === "NoSchedule"
  );

  results.push({
    id: "has-toleration",
    description: "Pod has a toleration for key `dedicated`, value `gpu`, effect `NoSchedule`",
    passed: hasToleration,
    hint: !hasToleration
      ? "Add a `tolerations` block: `- key: dedicated  operator: Equal  value: gpu  effect: NoSchedule`."
      : undefined,
  });

  const nodeSelector = pod.spec.nodeSelector ?? {};
  const hasNodeSelector = nodeSelector["kubernetes.io/hostname"] === "sim-node-2";

  results.push({
    id: "has-nodeselector",
    description: "Pod has nodeSelector `kubernetes.io/hostname: sim-node-2`",
    passed: hasNodeSelector,
    hint: !hasNodeSelector
      ? `Add \`nodeSelector:\n  kubernetes.io/hostname: sim-node-2\` to the pod spec.`
      : undefined,
  });

  results.push({
    id: "pod-running",
    description: "Pod phase is `Running`",
    passed: pod.status.phase === "Running",
    hint: pod.status.phase === "Pending"
      ? "Pod is Pending. Ensure both the toleration and nodeSelector are set correctly."
      : pod.status.phase === "Failed"
      ? "Pod failed. Check the container command."
      : undefined,
  });

  return results;
}
