import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyA7(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];

  const namespaces = sim.getNamespaces();
  const ns = namespaces.find((n) => n.metadata.name === "production");

  results.push({
    id: "ns-exists",
    description: "Namespace `production` exists",
    passed: ns?.status.phase === "Active",
    hint: ns ? undefined : "Apply a Namespace manifest with `metadata.name: production`.",
  });

  const cms = sim.getConfigMaps("production");
  const cm = cms.find((c) => c.metadata.name === "api-config");
  const cmHasKey = !!cm?.data?.["LOG_LEVEL"];

  results.push({
    id: "cm-exists",
    description: "ConfigMap `api-config` exists in `production` with key `LOG_LEVEL`",
    passed: cmHasKey,
    hint: !cmHasKey
      ? "Create a ConfigMap named `api-config` in the `production` namespace with a `LOG_LEVEL` key."
      : undefined,
  });

  const secrets = sim.getSecrets("production");
  const secret = secrets.find((s) => s.metadata.name === "api-secrets");
  const secretHasKey = !!secret?.data?.["jwt-secret"];

  results.push({
    id: "secret-exists",
    description: "Secret `api-secrets` exists in `production` with key `jwt-secret`",
    passed: secretHasKey,
    hint: !secretHasKey
      ? "Create a Secret named `api-secrets` in the `production` namespace with a `jwt-secret` key."
      : undefined,
  });

  const deployments = sim.getDeployments("production");
  const deploy = deployments.find((d) => d.metadata.name === "api-server");
  const isReady = (deploy?.status.readyReplicas ?? 0) >= 3;

  results.push({
    id: "deploy-ready",
    description: "Deployment `api-server` has 3 ready replicas in `production`",
    passed: isReady,
    hint: !isReady
      ? `Deployment has ${deploy?.status.readyReplicas ?? 0}/3 ready replicas. Set \`spec.replicas: 3\` and ensure the namespace is \`production\`.`
      : undefined,
  });

  const services = sim.getServices("production");
  const svc = services.find((s) => s.metadata.name === "api-svc");
  const isLB = svc?.spec.type === "LoadBalancer";
  const hasPort443 = svc?.spec.ports.some((p) => p.port === 443) ?? false;

  results.push({
    id: "svc-lb",
    description: "Service `api-svc` is type `LoadBalancer` exposing port 443",
    passed: isLB && hasPort443,
    hint:
      !isLB || !hasPort443
        ? `Service type is \`${svc?.spec.type ?? "missing"}\`, ports: ${JSON.stringify(svc?.spec.ports ?? [])}. Set \`spec.type: LoadBalancer\` and \`ports[0].port: 443\`.`
        : undefined,
  });

  const endpoints = sim.getServiceEndpoints("api-svc", "production");
  results.push({
    id: "svc-endpoints",
    description: "Service routes to at least 1 Running pod",
    passed: endpoints.length > 0,
    hint:
      endpoints.length === 0
        ? "No Running pods match the Service selector. Ensure `spec.selector.app: api-server` matches the Deployment pod labels."
        : undefined,
  });

  return results;
}
