import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyA6(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];

  const namespaces = sim.getNamespaces();
  const ns = namespaces.find((n) => n.metadata.name === "staging");

  results.push({
    id: "ns-exists",
    description: "Namespace `staging` exists and is Active",
    passed: ns?.status.phase === "Active",
    hint: ns ? undefined : "Apply a Namespace manifest with `metadata.name: staging`.",
  });

  const deployments = sim.getDeployments("staging");
  const deploy = deployments.find((d) => d.metadata.name === "frontend");

  results.push({
    id: "deploy-exists",
    description: "Deployment `frontend` exists in `staging` namespace",
    passed: !!deploy,
    hint: deploy
      ? undefined
      : "Apply a Deployment with `metadata.name: frontend` and `metadata.namespace: staging`.",
  });

  const isReady = (deploy?.status.readyReplicas ?? 0) >= 2;
  results.push({
    id: "deploy-ready",
    description: "Deployment has 2 ready replicas",
    passed: isReady,
    hint: !isReady
      ? `Deployment has ${deploy?.status.readyReplicas ?? 0}/2 ready replicas. Set \`spec.replicas: 2\`.`
      : undefined,
  });

  const services = sim.getServices("staging");
  const svc = services.find((s) => s.metadata.name === "frontend-svc");

  results.push({
    id: "svc-exists",
    description: "Service `frontend-svc` exists in `staging` namespace",
    passed: !!svc,
    hint: svc
      ? undefined
      : "Apply a Service with `metadata.name: frontend-svc` and `metadata.namespace: staging`.",
  });

  const endpoints = sim.getServiceEndpoints("frontend-svc", "staging");
  results.push({
    id: "svc-endpoints",
    description: "Service routes to at least 1 Running pod in `staging`",
    passed: endpoints.length > 0,
    hint:
      endpoints.length === 0
        ? `No Running pods in \`staging\` match the Service selector. Ensure \`spec.selector.app: frontend\` matches the Deployment pod labels.`
        : undefined,
  });

  return results;
}
