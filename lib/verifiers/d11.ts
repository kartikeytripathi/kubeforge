import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD11(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const cms = sim.getConfigMaps("default");
  const cm = cms.find((c) => c.metadata.name === "fargate-profile-config");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "cm-exists",
    description: "ConfigMap `fargate-profile-config` exists in `default`",
    passed: !!cm,
    hint: cm ? undefined : "Apply a ConfigMap named `fargate-profile-config` in the `default` namespace.",
  });

  const profileJson = cm?.data?.["profile.json"] ?? "";
  let profile: any = null;
  try { profile = JSON.parse(profileJson); } catch { /* invalid JSON */ }

  const selectors: any[] = profile?.selectors ?? [];
  const correctNs = selectors.some((s: any) => s.namespace === "reporting");

  results.push({
    id: "correct-namespace",
    description: "Selector `namespace` is `reporting` (not `reports`)",
    passed: correctNs,
    hint: correctNs
      ? undefined
      : "The selector namespace is misspelled as `reports`. Change it to `reporting` to match where the pods are scheduled.",
  });

  const hasLabelSelector = selectors.some(
    (s: any) => s.labels && typeof s.labels === "object" && s.labels["team"] === "data"
  );

  results.push({
    id: "has-label-selector",
    description: "Selector includes `labels` with `team: data`",
    passed: hasLabelSelector,
    hint: hasLabelSelector
      ? undefined
      : "Add `\"labels\": { \"team\": \"data\" }` to the selector so only pods with that label run on Fargate.",
  });

  const hasExecRole = !!(profile?.podExecutionRoleArn);

  results.push({
    id: "has-exec-role",
    description: "`podExecutionRoleArn` is present and non-empty",
    passed: hasExecRole,
    hint: hasExecRole
      ? undefined
      : "Add `podExecutionRoleArn` with the IAM role ARN that Fargate uses to pull images and write logs.",
  });

  return results;
}
