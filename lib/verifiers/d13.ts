import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD13(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];

  // Fix 1: ArgoCD ConfigMap targetRevision = main
  const argoCMs = sim.getConfigMaps("argocd");
  const argoConfig = argoCMs.find((c) => c.metadata.name === "argocd-app-config");
  const appYaml = argoConfig?.data?.["application.yaml"] ?? "";
  const hasMainRevision = /targetRevision:\s*main/.test(appYaml);

  results.push({
    id: "argocd-revision",
    description: "ArgoCD ConfigMap `targetRevision` is `main`",
    passed: hasMainRevision,
    hint: hasMainRevision
      ? undefined
      : "Change `targetRevision: feature/old-checkout` to `targetRevision: main` in the `argocd-app-config` ConfigMap.",
  });

  // Fix 2: checkout PDB minAvailable < 3
  const pdbs = sim.getPodDisruptionBudgets("default");
  const checkoutPdb = pdbs.find((p) => p.metadata.name === "checkout-pdb");
  const minAvail = checkoutPdb?.spec?.minAvailable;
  const hasHeadroom = typeof minAvail === "number" ? minAvail < 3 : minAvail !== undefined && parseInt(String(minAvail)) < 3;

  results.push({
    id: "pdb-headroom",
    description: "PDB `checkout-pdb` has `minAvailable` < 3 (leaves drain headroom)",
    passed: hasHeadroom,
    hint: hasHeadroom
      ? undefined
      : "The `checkout-pdb` has `minAvailable: 3` with only 3 replicas — drain is permanently blocked. Change to `minAvailable: 2`.",
  });

  // Fix 3: prod-pool NodePool uses WhenEmpty
  const nodePools = sim.getCustomResources("NodePool");
  const prodPool = nodePools.find((np) => np.metadata.name === "prod-pool");
  const consolidationPolicy = prodPool?.spec?.disruption?.consolidationPolicy;
  const isWhenEmpty = consolidationPolicy === "WhenEmpty";

  results.push({
    id: "karpenter-policy",
    description: "NodePool `prod-pool` uses `WhenEmpty` consolidation (not WhenEmptyOrUnderutilized)",
    passed: isWhenEmpty,
    hint: isWhenEmpty
      ? undefined
      : "Change `consolidationPolicy` from `WhenEmptyOrUnderutilized` to `WhenEmpty` on `prod-pool` to stop evicting pods under load.",
  });

  // Fix 4: orders-sa correct role ARN
  const serviceAccounts = sim.getServiceAccounts("default");
  const ordersSa = serviceAccounts.find((sa) => sa.metadata.name === "orders-sa");
  const roleArn = ordersSa?.metadata?.annotations?.["eks.amazonaws.com/role-arn"] ?? "";
  const hasCorrectRole = roleArn.includes("orders-ecr-pull");

  results.push({
    id: "correct-role",
    description: "ServiceAccount `orders-sa` annotation references `orders-ecr-pull` role",
    passed: hasCorrectRole,
    hint: hasCorrectRole
      ? undefined
      : "Update the `eks.amazonaws.com/role-arn` annotation on `orders-sa` to `arn:aws:iam::123456789012:role/orders-ecr-pull`.",
  });

  return results;
}
