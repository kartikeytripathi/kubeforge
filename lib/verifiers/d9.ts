import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD9(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const cms = sim.getConfigMaps("default");
  const cm = cms.find((c) => c.metadata.name === "ecr-lifecycle-policy");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "cm-exists",
    description: "ConfigMap `ecr-lifecycle-policy` exists in `default`",
    passed: !!cm,
    hint: cm ? undefined : "Apply a ConfigMap named `ecr-lifecycle-policy` in the `default` namespace.",
  });

  const policyJson = cm?.data?.["policy.json"] ?? "";
  let policy: any = null;
  try { policy = JSON.parse(policyJson); } catch { /* invalid JSON */ }

  const rules: any[] = policy?.rules ?? [];

  const protectRule = rules.find(
    (r: any) => r.selection?.tagPatternList && Array.isArray(r.selection.tagPatternList)
  );

  results.push({
    id: "has-protect-rule",
    description: "Policy contains a rule with `tagPatternList`",
    passed: !!protectRule,
    hint: protectRule
      ? undefined
      : "Add a rule with `selection.tagPatternList` to protect production image tags from deletion.",
  });

  const patterns: string[] = protectRule?.selection?.tagPatternList ?? [];
  const protectsProd = patterns.some((p) => p.includes("prod") || p.includes("release"));

  results.push({
    id: "protects-prod",
    description: "`tagPatternList` includes a `prod-*` or `release-*` pattern",
    passed: protectsProd,
    hint: protectsProd
      ? undefined
      : "The `tagPatternList` should include `\"prod-*\"` or `\"release-*\"` to protect production image tags.",
  });

  const priority1 = protectRule?.rulePriority === 1;

  results.push({
    id: "priority-1",
    description: "Protect rule has `rulePriority: 1` (runs before the cleanup rule)",
    passed: priority1,
    hint: priority1
      ? undefined
      : "Set `rulePriority: 1` on the protect rule so it evaluates before the cleanup rule.",
  });

  return results;
}
