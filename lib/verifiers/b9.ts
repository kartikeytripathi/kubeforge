import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyB9(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];
  const hpas = sim.getHPAs("default");
  const hpa = hpas.find((h) => h.metadata.name === "api-hpa");

  results.push({
    id: "hpa-exists",
    description: "HPA `api-hpa` exists in the `default` namespace",
    passed: !!hpa,
    hint: !hpa ? "Apply an `autoscaling/v2` HorizontalPodAutoscaler manifest with `metadata.name: api-hpa`." : undefined,
  });

  if (!hpa) return results;

  const targetsApi =
    hpa.spec.scaleTargetRef.kind === "Deployment" && hpa.spec.scaleTargetRef.name === "api";

  results.push({
    id: "targets-api",
    description: "HPA targets the `api` Deployment",
    passed: targetsApi,
    hint: !targetsApi
      ? `Set \`spec.scaleTargetRef.kind: Deployment\` and \`spec.scaleTargetRef.name: api\`. Currently: ${hpa.spec.scaleTargetRef.kind}/${hpa.spec.scaleTargetRef.name}.`
      : undefined,
  });

  results.push({
    id: "min-replicas",
    description: "`minReplicas` is 2 or higher",
    passed: hpa.spec.minReplicas >= 2,
    hint: hpa.spec.minReplicas < 2
      ? `minReplicas is ${hpa.spec.minReplicas}. Set \`spec.minReplicas: 2\` to ensure at least 2 replicas are always running.`
      : undefined,
  });

  results.push({
    id: "max-replicas",
    description: "`maxReplicas` is 5 or higher",
    passed: hpa.spec.maxReplicas >= 5,
    hint: hpa.spec.maxReplicas < 5
      ? `maxReplicas is ${hpa.spec.maxReplicas}. Set \`spec.maxReplicas: 5\` (or higher) to allow scaling under load.`
      : undefined,
  });

  const cpuMetric = hpa.spec.metrics?.find(
    (m) => m.type === "Resource" && m.resource.name === "cpu"
  );
  const cpuTarget = cpuMetric?.resource?.target?.averageUtilization;

  results.push({
    id: "cpu-target-70",
    description: "`averageUtilization` is set to 70",
    passed: cpuTarget === 70,
    hint: cpuTarget !== 70
      ? cpuTarget == null
        ? "Add a CPU metric under `spec.metrics` with `resource.target.averageUtilization: 70`."
        : `Current averageUtilization: ${cpuTarget}. Change it to 70.`
      : undefined,
  });

  return results;
}
