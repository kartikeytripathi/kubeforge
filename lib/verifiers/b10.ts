import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

function parseCpuMillis(cpu: string | undefined): number {
  if (!cpu) return 0;
  if (cpu.endsWith("m")) return parseInt(cpu, 10);
  return Math.round(parseFloat(cpu) * 1000);
}

export function verifyB10(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];

  // ── Fix 1: api liveness probe ─────────────────────────────────────────────
  const deployments = sim.getDeployments("default");
  const apiDeploy = deployments.find((d) => d.metadata.name === "api");
  const apiContainer = apiDeploy?.spec.template.spec.containers.find((c) => c.name === "api");
  const probePath = apiContainer?.livenessProbe?.httpGet?.path;

  results.push({
    id: "api-probe-fixed",
    description: "`api` Deployment liveness probe path is `/healthz`",
    passed: probePath === "/healthz",
    hint: probePath !== "/healthz"
      ? `Current probe path: \`${probePath ?? "(none)"}\`. Change it from \`/heathz\` to \`/healthz\` in the Deployment spec.`
      : undefined,
  });

  const apiPods = sim.getPods({ namespace: "default" }).filter(
    (p) => p.metadata.labels["app"] === "api"
  );
  const apiCrashing = apiPods.some((p) =>
    p.status.containerStatuses.some((cs) => cs.state.reason === "CrashLoopBackOff")
  );
  const apiRunning = apiPods.filter((p) => p.status.phase === "Running" && !apiCrashing).length >= 1;

  results.push({
    id: "api-pods-running",
    description: "`api` pods are Running and not restarting",
    passed: apiRunning,
    hint: !apiRunning
      ? apiCrashing
        ? "api pods are in CrashLoopBackOff — fix the liveness probe path (`/heathz` → `/healthz`) and re-apply."
        : "No api pods are Running yet. Apply the fixed Deployment and wait."
      : undefined,
  });

  // ── Fix 2: worker CPU requests ────────────────────────────────────────────
  const workerDeploy = deployments.find((d) => d.metadata.name === "worker");
  const workerContainer = workerDeploy?.spec.template.spec.containers.find((c) => c.name === "worker");
  const workerCpu = parseCpuMillis(workerContainer?.resources?.requests?.cpu);
  const workerCpuOk = workerCpu > 0 && workerCpu <= 800;

  results.push({
    id: "worker-cpu-fixed",
    description: "`worker` container CPU request is `800m` or less",
    passed: workerCpuOk,
    hint: !workerCpuOk
      ? `Current CPU request: ${workerContainer?.resources?.requests?.cpu ?? "(none)"}. Reduce it to 800m or less (e.g. \`cpu: "600m"\`).`
      : undefined,
  });

  const workerPods = sim.getPods({ namespace: "default" }).filter(
    (p) => p.metadata.labels["app"] === "worker"
  );
  const workerRunning = workerPods.filter((p) => p.status.phase === "Running").length >= 2;

  results.push({
    id: "worker-pods-running",
    description: "Both `worker` pods are Running",
    passed: workerRunning,
    hint: !workerRunning
      ? `${workerPods.filter((p) => p.status.phase === "Running").length}/2 worker pods Running. Reduce CPU requests so both pods can be scheduled.`
      : undefined,
  });

  // ── Fix 3: logger DaemonSet toleration ────────────────────────────────────
  const daemonSets = sim.getDaemonSets("default");
  const loggerDs = daemonSets.find((d) => d.metadata.name === "logger");
  const loggerTolerations = loggerDs?.spec.template.spec.tolerations ?? [];
  const hasToleration = loggerTolerations.some(
    (t) => t.key === "env" && t.value === "prod" && t.effect === "NoSchedule"
  );

  results.push({
    id: "logger-toleration",
    description: "`logger` DaemonSet has toleration for key `env`, value `prod`, effect `NoSchedule`",
    passed: hasToleration,
    hint: !hasToleration
      ? "Add `tolerations: [{key: env, operator: Equal, value: prod, effect: NoSchedule}]` under `spec.template.spec` in the logger DaemonSet."
      : undefined,
  });

  results.push({
    id: "logger-ds-ready",
    description: "`logger` DaemonSet `numberReady` equals 2",
    passed: (loggerDs?.status.numberReady ?? 0) >= 2,
    hint: (loggerDs?.status.numberReady ?? 0) < 2
      ? `logger numberReady: ${loggerDs?.status.numberReady ?? 0}/2. Add the toleration and wait for the new pod to start on sim-node-1.`
      : undefined,
  });

  return results;
}
