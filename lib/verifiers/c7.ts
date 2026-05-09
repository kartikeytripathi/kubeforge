import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyC7(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const policies = sim.getCustomResources("ClusterPolicy");
  const policy = policies.find((r) => r.metadata.name === "disallow-privileged");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "policy-exists",
    description: "ClusterPolicy `disallow-privileged` exists",
    passed: !!policy,
    hint: policy ? undefined : "Apply a Kyverno ClusterPolicy with `metadata.name: disallow-privileged`.",
  });

  if (!policy) return results;

  const action = policy.spec?.validationFailureAction;
  const isEnforce = action === "Enforce" || action === "enforce";
  results.push({
    id: "enforce-mode",
    description: "`validationFailureAction` is `Enforce`",
    passed: isEnforce,
    hint: !isEnforce
      ? `Current action: \`${action ?? "unset"}\`. Change to \`Enforce\` — \`audit\` only logs violations, it doesn't block them.`
      : undefined,
  });

  const rules = policy.spec?.rules ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targetsPods = rules.some((r: any) => {
    const kinds: string[] = r?.match?.any?.[0]?.resources?.kinds ?? r?.match?.resources?.kinds ?? [];
    return kinds.includes("Pod");
  });

  results.push({
    id: "targets-pods",
    description: "Rules match `Pod` resources",
    passed: targetsPods,
    hint: !targetsPods ? "Add `kinds: [Pod]` under `match.any[0].resources`." : undefined,
  });

  return results;
}
