import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyB5(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];
  const daemonSets = sim.getDaemonSets("default");
  const ds = daemonSets.find((d) => d.metadata.name === "log-collector");

  results.push({
    id: "ds-exists",
    description: "DaemonSet `log-collector` exists in the `default` namespace",
    passed: !!ds,
    hint: !ds ? "Apply an `apps/v1` DaemonSet manifest with `metadata.name: log-collector`." : undefined,
  });

  if (!ds) return results;

  results.push({
    id: "desired-scheduled",
    description: "`desiredNumberScheduled` equals 2 (one per node)",
    passed: ds.status.desiredNumberScheduled === 2,
    hint: ds.status.desiredNumberScheduled !== 2
      ? `desiredNumberScheduled is ${ds.status.desiredNumberScheduled}. The cluster has 2 nodes — apply the DaemonSet and wait for the controller to update the status.`
      : undefined,
  });

  results.push({
    id: "number-ready",
    description: "`numberReady` equals 2 (both pods Running and ready)",
    passed: ds.status.numberReady === 2,
    hint: ds.status.numberReady < 2
      ? `${ds.status.numberReady}/2 pods ready. Wait a few seconds for the pods to start, or check that the container image and command are valid.`
      : undefined,
  });

  return results;
}
