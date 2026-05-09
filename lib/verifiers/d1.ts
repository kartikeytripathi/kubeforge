import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD1(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const pools = sim.getCustomResources("NodePool");
  const stateful = pools.find((r) => r.metadata.name === "stateful");
  const burst = pools.find((r) => r.metadata.name === "burst");
  const results: ObjectiveResult[] = [];

  // Check stateful pool
  const statefulCapacity: string[] =
    stateful?.spec?.template?.spec?.requirements?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => r.key === "karpenter.sh/capacity-type"
    )?.values ?? [];

  results.push({
    id: "stateful-pool",
    description: "NodePool `stateful` exists with only `on-demand` capacity",
    passed: !!stateful && statefulCapacity.includes("on-demand") && !statefulCapacity.includes("spot"),
    hint: !stateful
      ? "Create a NodePool named `stateful` with `karpenter.sh/capacity-type` values: [\"on-demand\"]."
      : statefulCapacity.includes("spot")
      ? "Remove `spot` from the `stateful` NodePool — stateful workloads need guaranteed capacity."
      : undefined,
  });

  results.push({
    id: "stateful-policy",
    description: "NodePool `stateful` uses `WhenEmpty` consolidation",
    passed: stateful?.spec?.disruption?.consolidationPolicy === "WhenEmpty",
    hint:
      stateful?.spec?.disruption?.consolidationPolicy !== "WhenEmpty"
        ? `Current consolidationPolicy: \`${stateful?.spec?.disruption?.consolidationPolicy}\`. Set to \`WhenEmpty\` to avoid evicting stateful pods.`
        : undefined,
  });

  const burstCapacity: string[] =
    burst?.spec?.template?.spec?.requirements?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => r.key === "karpenter.sh/capacity-type"
    )?.values ?? [];

  results.push({
    id: "burst-pool",
    description: "NodePool `burst` exists with `spot` capacity",
    passed: !!burst && burstCapacity.includes("spot"),
    hint: !burst
      ? "Create a NodePool named `burst` with `karpenter.sh/capacity-type` values: [\"spot\"]."
      : !burstCapacity.includes("spot")
      ? "Add `spot` to the `burst` NodePool capacity types."
      : undefined,
  });

  results.push({
    id: "burst-policy",
    description: "NodePool `burst` uses `WhenEmptyOrUnderutilized` consolidation",
    passed: burst?.spec?.disruption?.consolidationPolicy === "WhenEmptyOrUnderutilized",
    hint:
      burst?.spec?.disruption?.consolidationPolicy !== "WhenEmptyOrUnderutilized"
        ? "Set `disruption.consolidationPolicy: WhenEmptyOrUnderutilized` on the burst NodePool for aggressive cost optimization."
        : undefined,
  });

  return results;
}
