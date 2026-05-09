import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyB1(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];
  const deployments = sim.getDeployments("default");
  const deploy = deployments.find((d) => d.metadata.name === "web");

  results.push({
    id: "deploy-exists",
    description: "Deployment `web` exists in the `default` namespace",
    passed: !!deploy,
    hint: !deploy ? "Apply an `apps/v1` Deployment manifest with `metadata.name: web`." : undefined,
  });

  if (!deploy) return results;

  const container = deploy.spec.template.spec.containers[0];
  const probe = container?.livenessProbe;

  results.push({
    id: "probe-exists",
    description: "Container has a `livenessProbe` defined",
    passed: !!probe,
    hint: !probe ? "Add a `livenessProbe` block under `spec.template.spec.containers[0]`." : undefined,
  });

  const probePath = probe?.httpGet?.path;
  results.push({
    id: "probe-path",
    description: "livenessProbe httpGet path is `/healthz`",
    passed: probePath === "/healthz",
    hint: probePath !== "/healthz"
      ? `Current path is \`${probePath ?? "(none)"}\`. Change it to \`/healthz\`.`
      : undefined,
  });

  const pods = sim.getPods({ namespace: "default" }).filter(
    (p) => p.metadata.ownerReference?.kind === "ReplicaSet" &&
           Object.entries(deploy.spec.selector.matchLabels).every(([k, v]) => p.metadata.labels[k] === v)
  );
  const runningPod = pods.find((p) => p.status.phase === "Running");
  const crashing = runningPod?.status.containerStatuses.some((cs) => cs.state.reason === "CrashLoopBackOff");

  results.push({
    id: "pod-running",
    description: "Pod phase is `Running`",
    passed: !!runningPod && !crashing,
    hint: crashing
      ? "Pod is running but liveness probe keeps failing. Check that the probe path matches a real endpoint."
      : !runningPod
      ? "No Running pod yet — wait a few seconds or check your Deployment spec."
      : undefined,
  });

  results.push({
    id: "pod-ready",
    description: "Pod is Ready (liveness probe passing)",
    passed: !!runningPod && !crashing,
    hint: crashing ? "Fix the liveness probe path so it returns HTTP 200." : undefined,
  });

  return results;
}
