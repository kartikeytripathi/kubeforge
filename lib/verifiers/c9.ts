import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyC9(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];

  const cms = sim.getConfigMaps("argocd");
  const cm = cms.find((c) => c.metadata.name === "argocd-cmd-params-cm");
  const limit = cm?.data?.["reposerver.parallelism.limit"];
  const limitNum = limit ? parseInt(limit, 10) : 0;

  results.push({
    id: "parallelism-high",
    description: "`reposerver.parallelism.limit` is 10 or higher",
    passed: !isNaN(limitNum) && limitNum >= 10,
    hint:
      limitNum < 10
        ? `Current limit: \`${limit ?? "1"}\`. Change to \`"10"\` (or higher) in the ConfigMap data.`
        : undefined,
  });

  const deploys = sim.getDeployments("argocd");
  const deploy = deploys.find((d) => d.metadata.name === "argocd-repo-server");

  results.push({
    id: "replicas-3",
    description: "Deployment `argocd-repo-server` has `replicas >= 3`",
    passed: !!deploy && deploy.spec.replicas >= 3,
    hint:
      !deploy
        ? "Apply a Deployment with `metadata.name: argocd-repo-server` and `spec.replicas: 3`."
        : deploy.spec.replicas < 3
        ? `Current replicas: ${deploy.spec.replicas}. Increase to at least 3.`
        : undefined,
  });

  const runningPods = sim
    .getPods({ namespace: "argocd" })
    .filter(
      (p) =>
        p.status.phase === "Running" &&
        (p.metadata.labels["app.kubernetes.io/name"] === "argocd-repo-server" ||
          p.metadata.name.startsWith("argocd-repo-server"))
    );

  results.push({
    id: "pods-running",
    description: "argocd-repo-server pods are Running",
    passed: runningPods.length >= 3,
    hint:
      runningPods.length < 3
        ? `Only ${runningPods.length} argocd-repo-server pods are Running. Wait for the reconcile loop.`
        : undefined,
  });

  results.push({
    id: "cm-namespace",
    description: "ConfigMap is in namespace `argocd`",
    passed: !!cm,
    hint: cm ? undefined : "Apply the ConfigMap with `metadata.namespace: argocd`.",
  });

  return results;
}
