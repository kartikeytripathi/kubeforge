import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyB7(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];
  const ingresses = sim.getIngresses("default");
  const ingress = ingresses.find((i) => i.metadata.name === "app-ingress");

  results.push({
    id: "ingress-exists",
    description: "Ingress `app-ingress` exists in the `default` namespace",
    passed: !!ingress,
    hint: !ingress ? "Apply a `networking.k8s.io/v1` Ingress manifest with `metadata.name: app-ingress`." : undefined,
  });

  if (!ingress) return results;

  const allPaths = (ingress.spec.rules ?? []).flatMap((r) => r.http.paths);

  const rootPath = allPaths.find(
    (p) => p.path === "/" && p.backend.service.name === "frontend-svc" && p.backend.service.port.number === 80
  );

  results.push({
    id: "root-path",
    description: "Ingress has a rule for path `/` pointing to `frontend-svc` on port 80",
    passed: !!rootPath,
    hint: !rootPath
      ? "Add an Ingress rule with `path: /`, `backend.service.name: frontend-svc`, `backend.service.port.number: 80`."
      : undefined,
  });

  const apiPath = allPaths.find(
    (p) => p.path === "/api" && p.backend.service.name === "api-svc" && p.backend.service.port.number === 8080
  );

  results.push({
    id: "api-path",
    description: "Ingress has a rule for path `/api` pointing to `api-svc` on port 8080",
    passed: !!apiPath,
    hint: !apiPath
      ? "Add an Ingress rule with `path: /api`, `backend.service.name: api-svc`, `backend.service.port.number: 8080`."
      : undefined,
  });

  return results;
}
