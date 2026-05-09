import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

/**
 * Lab A1 — Fix a CrashLoopBackOff caused by a wrong container command.
 *
 * Objectives:
 *  1. The pod "webapp" exists in the default namespace.
 *  2. The pod is in Running phase.
 *  3. No container has a CrashLoopBackOff state.
 *  4. The restartPolicy is Always (default).
 */
export function verifyA1(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const pods = sim.getPods({ namespace: "default" });
  const target = pods.find((p) => p.metadata.name === "webapp" || p.metadata.labels["app"] === "webapp");

  const results: ObjectiveResult[] = [];

  results.push({
    id: "pod-exists",
    description: "Pod named `webapp` exists in the `default` namespace",
    passed: !!target,
    hint: target ? undefined : 'Apply a Pod manifest with `metadata.name: webapp` and `metadata.namespace: default`.',
  });

  if (!target) return results;

  const isCrashing = target.status.containerStatuses.some((cs) => cs.state.reason === "CrashLoopBackOff");

  results.push({
    id: "pod-running",
    description: "Pod phase is `Running`",
    passed: target.status.phase === "Running" && !isCrashing,
    hint:
      target.status.phase === "Pending"
        ? "The pod is still starting — wait a moment."
        : isCrashing
        ? "One or more containers are in CrashLoopBackOff. Check your `command` field — the process must not exit immediately."
        : undefined,
  });

  results.push({
    id: "no-crash",
    description: "No container is in `CrashLoopBackOff`",
    passed: !isCrashing,
    hint: isCrashing
      ? 'The current `command` causes the container to exit non-zero. Try `command: ["/bin/sh", "-c", "while true; do echo running; sleep 5; done"]` or remove the override entirely.'
      : undefined,
  });

  const restartPolicy = target.spec.restartPolicy;
  results.push({
    id: "restart-policy",
    description: "restartPolicy is `Always`",
    passed: restartPolicy === "Always",
    hint: restartPolicy !== "Always" ? "`restartPolicy: Always` keeps the container running after failures." : undefined,
  });

  return results;
}
