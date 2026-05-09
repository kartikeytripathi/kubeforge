import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

const AGGRESSIVE_DURATIONS = new Set(["10s", "30s", "1m", "2m", "5m", "10m"]);

export function verifyD5(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const pools = sim.getCustomResources("NodePool");
  const pool = pools.find((r) => r.metadata.name === "default");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "pool-exists",
    description: "NodePool `default` exists",
    passed: !!pool,
    hint: pool ? undefined : "Apply a NodePool with `metadata.name: default`.",
  });

  if (!pool) return results;

  const policy = pool.spec?.disruption?.consolidationPolicy;
  results.push({
    id: "when-empty",
    description: "`consolidationPolicy` is `WhenEmpty`",
    passed: policy === "WhenEmpty",
    hint:
      policy !== "WhenEmpty"
        ? `Current policy: \`${policy}\`. Change to \`WhenEmpty\` — \`WhenEmptyOrUnderutilized\` evicts running pods during traffic dips.`
        : undefined,
  });

  const after = pool.spec?.disruption?.consolidateAfter;
  const isTooAggressive = AGGRESSIVE_DURATIONS.has(after);
  results.push({
    id: "slow-consolidate",
    description: "`consolidateAfter` is `30m` or longer (not 10m)",
    passed: !!after && !isTooAggressive,
    hint: isTooAggressive
      ? `consolidateAfter is \`${after}\` — too aggressive for production. Set to \`30m\` or longer.`
      : !after
      ? "Set `disruption.consolidateAfter: 30m`."
      : undefined,
  });

  const capacities: string[] =
    pool.spec?.template?.spec?.requirements?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => r.key === "karpenter.sh/capacity-type"
    )?.values ?? [];

  results.push({
    id: "both-capacities",
    description: "Both `on-demand` and `spot` are in requirements",
    passed: capacities.includes("on-demand") && capacities.includes("spot"),
    hint:
      !capacities.includes("on-demand") || !capacities.includes("spot")
        ? `Capacity types: ${JSON.stringify(capacities)}. Keep both \`on-demand\` and \`spot\`.`
        : undefined,
  });

  return results;
}
