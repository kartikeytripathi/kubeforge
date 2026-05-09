import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD7(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const pdbs = sim.getPodDisruptionBudgets("default");
  const postgresPdb = pdbs.find((p) => p.metadata.name === "postgres-pdb");
  const redisPdb = pdbs.find((p) => p.metadata.name === "redis-pdb");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "postgres-pdb",
    description: "PDB `postgres-pdb` exists in `default`",
    passed: !!postgresPdb,
    hint: postgresPdb
      ? undefined
      : "Apply a PodDisruptionBudget with `metadata.name: postgres-pdb`.",
  });

  results.push({
    id: "postgres-min",
    description: "`postgres-pdb` uses `minAvailable` (not maxUnavailable)",
    passed: !!postgresPdb?.spec?.minAvailable && !postgresPdb?.spec?.maxUnavailable,
    hint: postgresPdb
      ? postgresPdb.spec?.maxUnavailable !== undefined
        ? "Remove `maxUnavailable` and use `minAvailable: 2` instead — guarantees at least 2 postgres replicas during a drain."
        : !postgresPdb.spec?.minAvailable
        ? "Add `spec.minAvailable: 2` to the postgres PDB."
        : undefined
      : undefined,
  });

  results.push({
    id: "redis-pdb",
    description: "PDB `redis-pdb` exists in `default`",
    passed: !!redisPdb,
    hint: redisPdb
      ? undefined
      : "Add a second YAML document with a PDB named `redis-pdb` for the redis Deployment.",
  });

  results.push({
    id: "redis-selector",
    description: "`redis-pdb` selector matches `app: redis`",
    passed: redisPdb?.spec?.selector?.matchLabels?.["app"] === "redis",
    hint:
      redisPdb && redisPdb.spec?.selector?.matchLabels?.["app"] !== "redis"
        ? `redis-pdb selector is ${JSON.stringify(redisPdb.spec?.selector?.matchLabels ?? {})}. Set \`matchLabels.app: redis\`.`
        : undefined,
  });

  return results;
}
