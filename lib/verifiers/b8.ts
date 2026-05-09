import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyB8(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];
  const serviceAccounts = sim.getServiceAccounts("default");
  const sa = serviceAccounts.find((s) => s.metadata.name === "monitor-sa");

  results.push({
    id: "sa-exists",
    description: "ServiceAccount `monitor-sa` exists in the `default` namespace",
    passed: !!sa,
    hint: !sa ? "Apply a `v1` ServiceAccount manifest with `metadata.name: monitor-sa`." : undefined,
  });

  const roles = sim.getRoles("default");
  const role = roles.find((r) => r.metadata.name === "pod-reader");
  const hasListVerb = role?.rules.some(
    (rule) => rule.resources.includes("pods") && rule.verbs.includes("list")
  ) ?? false;

  results.push({
    id: "role-list-verb",
    description: "Role `pod-reader` has verb `list` for the `pods` resource",
    passed: hasListVerb,
    hint: !hasListVerb
      ? !role
        ? "Create a Role named `pod-reader` with a rule for `resources: [pods]` and `verbs: [list]`."
        : "Role `pod-reader` exists but is missing `list` for `pods`. Check the `rules` block — ensure `resources: [pods]` and `verbs: [list]` (or `[get, list, watch]`)."
      : undefined,
  });

  const roleBindings = sim.getRoleBindings("default");
  const rb = roleBindings.find((r) => r.metadata.name === "pod-reader-binding");
  const bindsCorrectly =
    rb?.roleRef.name === "pod-reader" &&
    rb?.subjects.some((s) => s.kind === "ServiceAccount" && s.name === "monitor-sa");

  results.push({
    id: "rolebinding",
    description: "RoleBinding `pod-reader-binding` links `pod-reader` to `monitor-sa`",
    passed: !!bindsCorrectly,
    hint: !rb
      ? "Create a RoleBinding named `pod-reader-binding` with `roleRef.name: pod-reader` and a subject for ServiceAccount `monitor-sa`."
      : !bindsCorrectly
      ? `RoleBinding exists but doesn't link correctly. Check \`roleRef.name\` (should be \`pod-reader\`) and \`subjects[].name\` (should be \`monitor-sa\`).`
      : undefined,
  });

  return results;
}
