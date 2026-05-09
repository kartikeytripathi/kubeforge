import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyC2(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const webhooks = sim.getCustomResources("ValidatingWebhookConfiguration");
  const wh = webhooks.find((r) => r.metadata.name === "no-latest-images");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "webhook-exists",
    description: "ValidatingWebhookConfiguration `no-latest-images` exists",
    passed: !!wh,
    hint: wh ? undefined : "Apply a ValidatingWebhookConfiguration with `metadata.name: no-latest-images`.",
  });

  if (!wh) return results;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstWebhook = (wh.spec?.webhooks ?? [])[0] as any;

  results.push({
    id: "failure-fail",
    description: "`failurePolicy` is `Fail`",
    passed: firstWebhook?.failurePolicy === "Fail",
    hint:
      firstWebhook?.failurePolicy !== "Fail"
        ? `failurePolicy is currently \`${firstWebhook?.failurePolicy}\`. Change it to \`Fail\` — otherwise the webhook is bypassed when unavailable.`
        : undefined,
  });

  const operations: string[] = firstWebhook?.rules?.[0]?.operations ?? [];
  results.push({
    id: "has-create",
    description: "Operations include `CREATE`",
    passed: operations.includes("CREATE"),
    hint: !operations.includes("CREATE")
      ? "Add `CREATE` to `rules[0].operations`. Without it, new pods skip the webhook entirely."
      : undefined,
  });

  const resources: string[] = firstWebhook?.rules?.[0]?.resources ?? [];
  results.push({
    id: "targets-pods",
    description: "Rules target `pods` resource",
    passed: resources.includes("pods"),
    hint: !resources.includes("pods") ? "Set `rules[0].resources: [\"pods\"]`." : undefined,
  });

  return results;
}
