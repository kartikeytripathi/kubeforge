import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD6(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const pools = sim.getCustomResources("NodePool");
  const pool = pools.find((r) => r.metadata.name === "auto-mode-pool");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "pool-exists",
    description: "NodePool `auto-mode-pool` exists",
    passed: !!pool,
    hint: pool ? undefined : "Apply a NodePool with `metadata.name: auto-mode-pool`.",
  });

  if (!pool) return results;

  const nodeClassRef = pool.spec?.template?.spec?.nodeClassRef ?? {};
  results.push({
    id: "class-name",
    description: "`nodeClassRef.name` is `default`",
    passed: nodeClassRef.name === "default",
    hint:
      nodeClassRef.name !== "default"
        ? `nodeClassRef.name is \`${nodeClassRef.name}\`. Change to \`default\` — EKS Auto Mode only has one built-in NodeClass.`
        : undefined,
  });

  results.push({
    id: "class-group",
    description: "`nodeClassRef.group` is `eks.amazonaws.com`",
    passed: nodeClassRef.group === "eks.amazonaws.com",
    hint:
      nodeClassRef.group !== "eks.amazonaws.com"
        ? `nodeClassRef.group is \`${nodeClassRef.group}\`. Set to \`eks.amazonaws.com\`.`
        : undefined,
  });

  results.push({
    id: "class-kind",
    description: "`nodeClassRef.kind` is `NodeClass`",
    passed: nodeClassRef.kind === "NodeClass",
    hint:
      nodeClassRef.kind !== "NodeClass"
        ? `nodeClassRef.kind is \`${nodeClassRef.kind}\`. Set to \`NodeClass\`.`
        : undefined,
  });

  return results;
}
