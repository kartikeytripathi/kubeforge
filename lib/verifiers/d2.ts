import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD2(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const cms = sim.getConfigMaps("kube-system");
  const cm = cms.find((c) => c.metadata.name === "amazon-vpc-cni");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "cm-exists",
    description: "ConfigMap `amazon-vpc-cni` exists in `kube-system`",
    passed: !!cm,
    hint: cm ? undefined : "Apply the ConfigMap with `metadata.name: amazon-vpc-cni` and `metadata.namespace: kube-system`.",
  });

  if (!cm) return results;

  results.push({
    id: "prefix-enabled",
    description: "`ENABLE_PREFIX_DELEGATION` is `\"true\"`",
    passed: cm.data?.["ENABLE_PREFIX_DELEGATION"] === "true",
    hint:
      cm.data?.["ENABLE_PREFIX_DELEGATION"] !== "true"
        ? `Currently: \`${cm.data?.["ENABLE_PREFIX_DELEGATION"] ?? "unset"}\`. Set \`ENABLE_PREFIX_DELEGATION: "true"\` to enable /28 prefix blocks.`
        : undefined,
  });

  results.push({
    id: "warm-eni-zero",
    description: "`WARM_ENI_TARGET` is `\"0\"`",
    passed: cm.data?.["WARM_ENI_TARGET"] === "0",
    hint:
      cm.data?.["WARM_ENI_TARGET"] !== "0"
        ? `WARM_ENI_TARGET is \`${cm.data?.["WARM_ENI_TARGET"] ?? "unset"}\`. Set to \`"0"\` — pre-warming whole ENIs wastes IPs. Use MINIMUM_IP_TARGET instead.`
        : undefined,
  });

  const minIp = cm.data?.["MINIMUM_IP_TARGET"];
  const minIpNum = minIp ? parseInt(minIp, 10) : 0;
  results.push({
    id: "min-ip-set",
    description: "`MINIMUM_IP_TARGET` is set to a non-zero value",
    passed: !isNaN(minIpNum) && minIpNum > 0,
    hint: !minIp || minIpNum === 0 ? "Set `MINIMUM_IP_TARGET: \"10\"` to maintain a warm pool of IPs for fast pod starts." : undefined,
  });

  return results;
}
