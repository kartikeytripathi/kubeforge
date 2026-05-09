import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD12(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const nodePools = sim.getCustomResources("NodePool");
  const statelessPool = nodePools.find((np) => np.metadata.name === "stateless-spot");
  const statefulPool = nodePools.find((np) => np.metadata.name === "stateful-ondemand");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "stateless-pool",
    description: "NodePool `stateless-spot` exists",
    passed: !!statelessPool,
    hint: statelessPool
      ? undefined
      : "Create a NodePool named `stateless-spot` for stateless workloads.",
  });

  const spotReqs: any[] = statelessPool?.spec?.template?.spec?.requirements ?? [];
  const isSpot = spotReqs.some(
    (r: any) => r.key === "karpenter.sh/capacity-type" && r.values?.includes("spot")
  );

  results.push({
    id: "spot-capacity",
    description: "`stateless-spot` uses Spot capacity type",
    passed: isSpot,
    hint: isSpot
      ? undefined
      : "Add a requirement with `key: karpenter.sh/capacity-type` and `values: [\"spot\"]` to `stateless-spot`.",
  });

  const spotPolicy = statelessPool?.spec?.disruption?.consolidationPolicy;
  const isConsolidating = spotPolicy === "WhenEmptyOrUnderutilized";

  results.push({
    id: "consolidation-on",
    description: "`stateless-spot` has `WhenEmptyOrUnderutilized` consolidation",
    passed: isConsolidating,
    hint: isConsolidating
      ? undefined
      : "Set `spec.disruption.consolidationPolicy: WhenEmptyOrUnderutilized` on `stateless-spot` for aggressive cost optimization.",
  });

  results.push({
    id: "stateful-pool",
    description: "NodePool `stateful-ondemand` exists",
    passed: !!statefulPool,
    hint: statefulPool
      ? undefined
      : "Create a second NodePool named `stateful-ondemand` for stateful/production workloads.",
  });

  const ondemandReqs: any[] = statefulPool?.spec?.template?.spec?.requirements ?? [];
  const isOndemand = ondemandReqs.some(
    (r: any) => r.key === "karpenter.sh/capacity-type" && r.values?.includes("on-demand")
  );

  results.push({
    id: "ondemand-only",
    description: "`stateful-ondemand` uses On-Demand capacity type",
    passed: isOndemand,
    hint: isOndemand
      ? undefined
      : "Add a requirement with `key: karpenter.sh/capacity-type` and `values: [\"on-demand\"]` to `stateful-ondemand`.",
  });

  return results;
}
