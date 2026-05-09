import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyA4(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];

  const cms = sim.getConfigMaps("default");
  const cm = cms.find((c) => c.metadata.name === "app-config");

  results.push({
    id: "configmap-exists",
    description: "ConfigMap `app-config` exists in `default` namespace",
    passed: !!cm,
    hint: cm ? undefined : "Apply a ConfigMap manifest with `metadata.name: app-config` and `metadata.namespace: default`.",
  });

  const cmHasKey = !!cm?.data?.["APP_ENV"] && cm.data["APP_ENV"] === "production";
  results.push({
    id: "configmap-key",
    description: "ConfigMap has key `APP_ENV` with value `production`",
    passed: cmHasKey,
    hint: !cmHasKey
      ? `Add \`APP_ENV: production\` to the ConfigMap's \`data\` section. Current data: ${JSON.stringify(cm?.data ?? {})}.`
      : undefined,
  });

  const secrets = sim.getSecrets("default");
  const secret = secrets.find((s) => s.metadata.name === "app-secret");

  results.push({
    id: "secret-exists",
    description: "Secret `app-secret` exists in `default` namespace",
    passed: !!secret,
    hint: secret ? undefined : "Apply a Secret manifest with `metadata.name: app-secret` and `type: Opaque`.",
  });

  const secretHasKey = !!secret?.data?.["password"];
  results.push({
    id: "secret-key",
    description: "Secret has key `password`",
    passed: secretHasKey,
    hint: !secretHasKey
      ? "Add a `password` key to the Secret's `data` section. The value should be base64-encoded."
      : undefined,
  });

  const pods = sim.getPods({ namespace: "default" });
  const webPod = pods.find((p) => p.metadata.name === "web");
  results.push({
    id: "pod-running",
    description: "Pod `web` is in Running phase",
    passed: webPod?.status.phase === "Running",
    hint:
      webPod?.status.phase !== "Running"
        ? `Pod \`web\` is currently ${webPod?.status.phase ?? "not found"}. Once the ConfigMap and Secret exist, the pod should start within a few seconds.`
        : undefined,
  });

  return results;
}
