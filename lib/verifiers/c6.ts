import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyC6(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const apps = sim.getCustomResources("Application", "argocd");
  const app = apps.find((r) => r.metadata.name === "shop-app");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "app-exists",
    description: "ArgoCD Application `shop-app` exists in namespace `argocd`",
    passed: !!app,
    hint: app
      ? undefined
      : "Apply an Application CR with `metadata.name: shop-app` and `metadata.namespace: argocd`.",
  });

  if (!app) return results;

  const prune = app.spec?.syncPolicy?.automated?.prune;
  results.push({
    id: "prune-on",
    description: "`syncPolicy.automated.prune` is `true`",
    passed: prune === true,
    hint:
      prune !== true
        ? "Set `syncPolicy.automated.prune: true`. Without prune, deleted manifests leave orphaned resources that trigger endless syncs."
        : undefined,
  });

  const duration = app.spec?.syncPolicy?.retry?.backoff?.duration;
  const isSlowEnough = duration === "3m" || duration === "180s" || duration === "5m" || duration === "10m";
  results.push({
    id: "backoff-slow",
    description: "Retry `backoff.duration` is `3m` (not 10s)",
    passed: isSlowEnough,
    hint:
      !isSlowEnough
        ? `Current backoff.duration: \`${duration ?? "unset"}\`. Change to \`3m\` to avoid hammering the GitHub API.`
        : undefined,
  });

  const destNs = app.spec?.destination?.namespace;
  results.push({
    id: "dest-ns",
    description: "`destination.namespace` is `default`",
    passed: destNs === "default",
    hint: destNs !== "default" ? `destination.namespace is \`${destNs}\`. Set to \`default\`.` : undefined,
  });

  return results;
}
