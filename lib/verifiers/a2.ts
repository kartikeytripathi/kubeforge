import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

/**
 * Lab A2 — Roll out a new image with zero downtime.
 *
 * Starting state: Deployment "frontend" running nginx:1.21 with 3 replicas.
 * Goal: update to nginx:1.25 using a RollingUpdate strategy.
 *
 * Objectives:
 *  1. Deployment "frontend" exists with replicas: 3.
 *  2. All containers use image nginx:1.25.
 *  3. strategy.type is RollingUpdate.
 *  4. 3 pods are Running with nginx:1.25.
 */
export function verifyA2(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const deployments = sim.getDeployments("default");
  const deploy = deployments.find((d) => d.metadata.name === "frontend");

  const results: ObjectiveResult[] = [];

  results.push({
    id: "deploy-exists",
    description: "Deployment `frontend` exists in `default` namespace",
    passed: !!deploy,
    hint: deploy ? undefined : "Apply a Deployment manifest with `metadata.name: frontend`.",
  });

  if (!deploy) return results;

  results.push({
    id: "three-replicas",
    description: "Deployment specifies `replicas: 3`",
    passed: deploy.spec.replicas === 3,
    hint: deploy.spec.replicas !== 3 ? "Set `spec.replicas: 3`." : undefined,
  });

  const containers = deploy.spec.template.spec.containers;
  const allNewImage = containers.every((c) => c.image === "nginx:1.25");

  results.push({
    id: "new-image",
    description: "All containers use image `nginx:1.25`",
    passed: allNewImage,
    hint: !allNewImage
      ? `Current image: ${containers[0]?.image ?? "unknown"}. Change to \`nginx:1.25\`.`
      : undefined,
  });

  const strategyType = deploy.spec.strategy?.type ?? "RollingUpdate";
  results.push({
    id: "rolling-update",
    description: "strategy.type is `RollingUpdate`",
    passed: strategyType === "RollingUpdate",
    hint: strategyType !== "RollingUpdate" ? "Set `spec.strategy.type: RollingUpdate`." : undefined,
  });

  const runningNewPods = sim
    .getPods({ namespace: "default" })
    .filter(
      (p) =>
        p.metadata.labels["app"] === "frontend" &&
        p.status.phase === "Running" &&
        p.spec.containers.every((c) => c.image === "nginx:1.25")
    );

  results.push({
    id: "pods-running",
    description: "3 pods are Running with nginx:1.25",
    passed: runningNewPods.length >= 3,
    hint:
      runningNewPods.length < 3
        ? `Only ${runningNewPods.length}/3 updated pods are Running. Wait for the rollout to complete.`
        : undefined,
  });

  return results;
}
