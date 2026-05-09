import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyC4(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const deployments = sim.getDeployments("default");
  const deploy = deployments.find((d) => d.metadata.name === "api-server");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "deploy-exists",
    description: "Deployment `api-server` exists in `default`",
    passed: !!deploy,
    hint: deploy ? undefined : "Apply a Deployment with `metadata.name: api-server`.",
  });

  if (!deploy) return results;

  results.push({
    id: "four-replicas",
    description: "Deployment specifies `replicas: 4`",
    passed: deploy.spec.replicas === 4,
    hint: deploy.spec.replicas !== 4 ? `Current replicas: ${deploy.spec.replicas}. Change to 4.` : undefined,
  });

  const runningPods = sim
    .getPods({ namespace: "default", labelSelector: { app: "api-server" } })
    .filter((p) => p.status.phase === "Running");

  results.push({
    id: "pods-running",
    description: "4 pods with label `app=api-server` are Running",
    passed: runningPods.length >= 4,
    hint:
      runningPods.length < 4
        ? `Only ${runningPods.length}/4 pods are Running. Wait for the reconcile loop to complete.`
        : undefined,
  });

  const rs = sim.getState().replicaSets.find(
    (r) => r.metadata.ownerReference?.name === "api-server"
  );

  results.push({
    id: "rs-exists",
    description: "A ReplicaSet owned by `api-server` exists",
    passed: !!rs,
    hint: rs ? undefined : "The ReplicaSet should be created automatically when the Deployment is applied.",
  });

  return results;
}
