import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyC10(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const webhooks = sim.getCustomResources("ValidatingWebhookConfiguration");
  const wh = webhooks.find((r) => r.metadata.name === "payments-validator");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "webhook-exists",
    description: "ValidatingWebhookConfiguration `payments-validator` exists",
    passed: !!wh,
    hint: wh ? undefined : "Apply a ValidatingWebhookConfiguration with `metadata.name: payments-validator`.",
  });

  if (!wh) return results;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstWebhook = ((wh.spec?.webhooks ?? []) as any[])[0];

  const timeout = firstWebhook?.timeoutSeconds as number | undefined;
  results.push({
    id: "timeout-reduced",
    description: "`timeoutSeconds` is ≤ 10",
    passed: typeof timeout === "number" && timeout <= 10,
    hint:
      typeof timeout !== "number" || timeout > 10
        ? `timeoutSeconds is currently \`${timeout ?? "unset"}\`. Reduce it to \`5\` — the API server blocks for the full timeout duration on every slow call.`
        : undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nsSelector = firstWebhook?.namespaceSelector as Record<string, any> | undefined;
  const teamLabel = nsSelector?.matchLabels?.team as string | undefined;
  results.push({
    id: "namespace-scoped",
    description: "`namespaceSelector.matchLabels.team` is `payments`",
    passed: teamLabel === "payments",
    hint:
      teamLabel !== "payments"
        ? "Add `namespaceSelector:\\n  matchLabels:\\n    team: payments` inside the webhook entry (same level as `failurePolicy`). Without it the webhook intercepts every namespace, including `kube-system`."
        : undefined,
  });

  return results;
}
