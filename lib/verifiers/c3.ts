import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyC3(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const pods = sim.getPods({ namespace: "default" });
  const pod = pods.find((p) => p.metadata.name === "gpu-workload");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "pod-exists",
    description: "Pod `gpu-workload` exists in `default` namespace",
    passed: !!pod,
    hint: pod ? undefined : "Apply a Pod manifest with `metadata.name: gpu-workload`.",
  });

  if (!pod) return results;

  results.push({
    id: "pod-running",
    description: "Pod is in `Running` phase (not Pending)",
    passed: pod.status.phase === "Running",
    hint:
      pod.status.phase === "Pending"
        ? "Pod is Pending — the scheduler cannot find a node. Remove or fix the `nodeSelector`."
        : undefined,
  });

  const hasProblematicSelector =
    pod.spec.nodeSelector !== undefined &&
    Object.keys(pod.spec.nodeSelector).some(
      (k) => !["kubernetes.io/hostname", "node-role.kubernetes.io/worker"].includes(k)
    );

  results.push({
    id: "no-selector",
    description: "Pod has no unsatisfiable `nodeSelector`",
    passed: !hasProblematicSelector,
    hint: hasProblematicSelector
      ? `nodeSelector has labels that no node carries: ${JSON.stringify(pod.spec.nodeSelector)}. Remove the nodeSelector block.`
      : undefined,
  });

  return results;
}
