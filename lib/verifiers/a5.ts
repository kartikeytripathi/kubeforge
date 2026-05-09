import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyA5(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];

  const storageClasses = sim.getStorageClasses();
  const sc = storageClasses.find((s) => s.metadata.name === "fast-ssd");

  results.push({
    id: "sc-exists",
    description: "StorageClass `fast-ssd` exists",
    passed: !!sc,
    hint: sc ? undefined : "Apply a StorageClass manifest with `metadata.name: fast-ssd`.",
  });

  const pvcs = sim.getPersistentVolumeClaims("default");
  const pvc = pvcs.find((p) => p.metadata.name === "db-pvc");

  results.push({
    id: "pvc-exists",
    description: "PVC `db-pvc` exists in `default` namespace",
    passed: !!pvc,
    hint: pvc ? undefined : "Apply a PersistentVolumeClaim with `metadata.name: db-pvc` in the `default` namespace.",
  });

  results.push({
    id: "pvc-bound",
    description: "PVC `db-pvc` is in `Bound` phase",
    passed: pvc?.status.phase === "Bound",
    hint:
      pvc?.status.phase !== "Bound"
        ? `PVC is in \`${pvc?.status.phase ?? "Pending"}\` phase. Ensure \`storageClassName: fast-ssd\` matches the StorageClass name and the StorageClass has \`volumeBindingMode: Immediate\`.`
        : undefined,
  });

  const requestedStorage = pvc?.spec.resources.requests.storage;
  const hasStorage = !!requestedStorage && requestedStorage !== "0";
  results.push({
    id: "pvc-size",
    description: "PVC requests at least 1Gi of storage",
    passed: hasStorage,
    hint: !hasStorage ? "Set `spec.resources.requests.storage` to at least `1Gi`." : undefined,
  });

  const pods = sim.getPods({ namespace: "default" });
  const postgresPod = pods.find((p) => p.metadata.name === "postgres");
  results.push({
    id: "pod-running",
    description: "Pod `postgres` is in Running phase",
    passed: postgresPod?.status.phase === "Running",
    hint:
      postgresPod?.status.phase !== "Running"
        ? `Pod \`postgres\` is ${postgresPod?.status.phase ?? "not found"}. Once the PVC is Bound, the pod will be scheduled.`
        : undefined,
  });

  return results;
}
