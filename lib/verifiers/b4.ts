import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

function parseStorageGi(storage: string | undefined): number {
  if (!storage) return 0;
  if (storage.endsWith("Gi")) return parseFloat(storage);
  if (storage.endsWith("Mi")) return parseFloat(storage) / 1024;
  if (storage.endsWith("Ti")) return parseFloat(storage) * 1024;
  return 0;
}

export function verifyB4(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];
  const statefulSets = sim.getStatefulSets("default");
  const sts = statefulSets.find((s) => s.metadata.name === "postgres");

  results.push({
    id: "sts-exists",
    description: "StatefulSet `postgres` exists in the `default` namespace",
    passed: !!sts,
    hint: !sts ? "Apply an `apps/v1` StatefulSet manifest with `metadata.name: postgres`." : undefined,
  });

  if (!sts) return results;

  results.push({
    id: "replicas-3",
    description: "StatefulSet has `replicas: 3`",
    passed: sts.spec.replicas === 3,
    hint: sts.spec.replicas !== 3
      ? `Current replicas: ${sts.spec.replicas}. Change \`spec.replicas\` to 3.`
      : undefined,
  });

  const pods = sim.getPods({ namespace: "default" }).filter(
    (p) => p.metadata.ownerReference?.uid === sts.metadata.uid
  );
  const pod0 = pods.find((p) => p.metadata.name === "postgres-0");
  const pod1 = pods.find((p) => p.metadata.name === "postgres-1");
  const pod2 = pods.find((p) => p.metadata.name === "postgres-2");
  const allRunning =
    pod0?.status.phase === "Running" &&
    pod1?.status.phase === "Running" &&
    pod2?.status.phase === "Running";

  results.push({
    id: "pods-running",
    description: "Pods `postgres-0`, `postgres-1`, and `postgres-2` are all Running",
    passed: allRunning,
    hint: !allRunning
      ? `Running: ${[pod0, pod1, pod2].filter((p) => p?.status.phase === "Running").length}/3. Wait for the StorageClass to provision PVCs, then pods will start.`
      : undefined,
  });

  const vct = sts.spec.volumeClaimTemplates?.[0];
  const storageReq = vct?.spec?.resources?.requests?.storage;
  const storageGi = parseStorageGi(storageReq);

  results.push({
    id: "pvc-templates",
    description: "`volumeClaimTemplates` defines storage request of at least `1Gi`",
    passed: storageGi >= 1,
    hint: storageGi < 1
      ? `Current storage request: ${storageReq ?? "(none)"}. Add a \`volumeClaimTemplates\` entry with \`resources.requests.storage: 1Gi\`.`
      : undefined,
  });

  return results;
}
