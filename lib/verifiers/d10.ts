import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD10(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const cms = sim.getConfigMaps("amazon-cloudwatch");
  const cm = cms.find((c) => c.metadata.name === "amazon-cloudwatch-agent");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "cm-exists",
    description: "ConfigMap `amazon-cloudwatch-agent` exists in `amazon-cloudwatch`",
    passed: !!cm,
    hint: cm ? undefined : "Apply a ConfigMap named `amazon-cloudwatch-agent` in the `amazon-cloudwatch` namespace.",
  });

  const configJson = cm?.data?.["cwagentconfig.json"] ?? "";
  let config: any = null;
  try { config = JSON.parse(configJson); } catch { /* invalid JSON */ }

  const collected = config?.metrics?.metrics_collected ?? {};

  const hasDisk = !!collected.disk;
  results.push({
    id: "has-disk",
    description: "`cwagentconfig.json` includes `disk` metrics collection",
    passed: hasDisk,
    hint: hasDisk
      ? undefined
      : "Add a `disk` key to `metrics.metrics_collected` with `measurement: [\"used_percent\"]` and `resources: [\"*\"]`.",
  });

  const hasMem = !!collected.mem;
  results.push({
    id: "has-mem",
    description: "`cwagentconfig.json` includes `mem` metrics collection",
    passed: hasMem,
    hint: hasMem
      ? undefined
      : "Add a `mem` key to `metrics.metrics_collected` with `measurement: [\"mem_used_percent\"]`.",
  });

  const diskMeasurements: string[] = collected.disk?.measurement ?? [];
  const hasMeasurement = diskMeasurements.length > 0;
  results.push({
    id: "has-path",
    description: "`disk` section includes a `measurement` entry",
    passed: hasMeasurement,
    hint: hasMeasurement
      ? undefined
      : "Add `measurement: [\"used_percent\"]` inside the `disk` section.",
  });

  return results;
}
