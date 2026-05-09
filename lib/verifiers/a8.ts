import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyA8(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];

  // 1. Deployment scaled up
  const deployments = sim.getDeployments("default");
  const apiDeploy = deployments.find((d) => d.metadata.name === "api");
  const hasReadyReplica = (apiDeploy?.status.readyReplicas ?? 0) >= 1;

  results.push({
    id: "deploy-scaled",
    description: "Deployment `api` has at least 1 ready replica",
    passed: hasReadyReplica,
    hint: !hasReadyReplica
      ? `Deployment \`api\` has ${apiDeploy?.status.readyReplicas ?? 0} ready replicas. Change \`spec.replicas\` from 0 to at least 1 (ideally 3).`
      : undefined,
  });

  // 2. Service selector fixed
  const services = sim.getServices("default");
  const apiSvc = services.find((s) => s.metadata.name === "api-svc");
  const selectorFixed = apiSvc?.spec.selector?.["app"] === "api";

  results.push({
    id: "svc-selector",
    description: "Service `api-svc` selector matches `app: api`",
    passed: selectorFixed,
    hint: !selectorFixed
      ? `Current selector: ${JSON.stringify(apiSvc?.spec.selector ?? {})}. Change \`spec.selector.app\` to \`api\`.`
      : undefined,
  });

  // 3. Service has live endpoints
  const endpoints = sim.getServiceEndpoints("api-svc", "default");
  results.push({
    id: "svc-endpoints",
    description: "Service `api-svc` routes to at least 1 Running pod",
    passed: endpoints.length > 0,
    hint:
      endpoints.length === 0
        ? "No Running pods match the Service selector. Fix both the replicas count and the selector to get endpoints."
        : undefined,
  });

  // 4. PVC bound
  const pvcs = sim.getPersistentVolumeClaims("default");
  const dbPvc = pvcs.find((p) => p.metadata.name === "db-pvc");

  results.push({
    id: "pvc-bound",
    description: "PVC `db-pvc` exists and is Bound",
    passed: dbPvc?.status.phase === "Bound",
    hint:
      dbPvc?.status.phase !== "Bound"
        ? `PVC \`db-pvc\` is ${dbPvc?.status.phase ?? "missing"}. Create a StorageClass and a PVC referencing it. Dynamic provisioning will bind it.`
        : undefined,
  });

  // 5. ConfigMap has DB_HOST key
  const cms = sim.getConfigMaps("default");
  const apiConfig = cms.find((c) => c.metadata.name === "api-config");
  const hasDbHost = !!apiConfig?.data?.["DB_HOST"];

  results.push({
    id: "cm-db-host",
    description: "ConfigMap `api-config` has key `DB_HOST`",
    passed: hasDbHost,
    hint: !hasDbHost
      ? `ConfigMap \`api-config\` is missing key \`DB_HOST\`. Add \`DB_HOST: postgres-svc.default.svc.cluster.local\` to its \`data\` section and re-apply.`
      : undefined,
  });

  return results;
}
