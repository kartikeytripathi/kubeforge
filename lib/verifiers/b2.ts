import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

function parseCpuMillis(cpu: string | undefined): number {
  if (!cpu) return 0;
  if (cpu.endsWith("m")) return parseInt(cpu, 10);
  return Math.round(parseFloat(cpu) * 1000);
}

export function verifyB2(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];
  const deployments = sim.getDeployments("default");
  const deploy = deployments.find((d) => d.metadata.name === "compute");

  results.push({
    id: "deploy-exists",
    description: "Deployment `compute` exists in the `default` namespace",
    passed: !!deploy,
    hint: !deploy ? "Apply a Deployment manifest with `metadata.name: compute`." : undefined,
  });

  if (!deploy) return results;

  results.push({
    id: "replicas-3",
    description: "Deployment has `replicas: 3`",
    passed: deploy.spec.replicas === 3,
    hint: deploy.spec.replicas !== 3
      ? `Current replicas: ${deploy.spec.replicas}. Set \`spec.replicas: 3\`.`
      : undefined,
  });

  const container = deploy.spec.template.spec.containers[0];
  const cpuReq = parseCpuMillis(container?.resources?.requests?.cpu);
  const cpuOk = cpuReq > 0 && cpuReq <= 800;

  results.push({
    id: "cpu-request-low",
    description: "Container CPU request is `800m` or less",
    passed: cpuOk,
    hint: !cpuOk
      ? `Current CPU request: ${container?.resources?.requests?.cpu ?? "(none)"}. Set it to 800m or less (e.g. \`cpu: "600m"\`).`
      : undefined,
  });

  const pods = sim.getPods({ namespace: "default" }).filter(
    (p) => Object.entries(deploy.spec.selector.matchLabels).every(([k, v]) => p.metadata.labels[k] === v)
  );
  const runningCount = pods.filter((p) => p.status.phase === "Running").length;

  results.push({
    id: "pods-running",
    description: "All 3 pods are in `Running` phase",
    passed: runningCount >= 3,
    hint: runningCount < 3
      ? `${runningCount}/3 pods Running. ${pods.filter((p) => p.status.phase === "Pending").length} still Pending — reduce CPU requests so they fit on the available nodes.`
      : undefined,
  });

  return results;
}
