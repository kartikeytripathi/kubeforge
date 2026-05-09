import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

/**
 * Lab A3 — Wire a frontend Deployment to a backend Service.
 *
 * Starting state: A "backend" Deployment with label app=backend is running.
 * The learner must create a ClusterIP Service that routes to it.
 *
 * Objectives:
 *  1. Service "backend-svc" exists in namespace "default".
 *  2. Service selector matches pods with label app=backend.
 *  3. Service has at least one healthy endpoint (Running backend pod).
 *  4. Service type is ClusterIP.
 *  5. Service exposes port 80.
 */
export function verifyA3(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const services = sim.getServices("default");
  const svc = services.find((s) => s.metadata.name === "backend-svc");

  const results: ObjectiveResult[] = [];

  results.push({
    id: "svc-exists",
    description: "Service `backend-svc` exists in `default` namespace",
    passed: !!svc,
    hint: svc ? undefined : "Apply a Service manifest with `metadata.name: backend-svc`.",
  });

  if (!svc) return results;

  const hasCorrectSelector =
    !!svc.spec.selector && svc.spec.selector["app"] === "backend";

  results.push({
    id: "correct-selector",
    description: "Service selector includes `app: backend`",
    passed: hasCorrectSelector,
    hint: !hasCorrectSelector
      ? `Current selector: ${JSON.stringify(svc.spec.selector ?? {})}. Set \`spec.selector.app: backend\`.`
      : undefined,
  });

  const endpoints = sim.getServiceEndpoints("backend-svc", "default");

  results.push({
    id: "has-endpoints",
    description: "Service routes to at least 1 healthy backend pod",
    passed: endpoints.length > 0,
    hint:
      endpoints.length === 0
        ? "No Running pods match the selector. Make sure the backend Deployment is applied and the selector labels match exactly."
        : undefined,
  });

  results.push({
    id: "type-clusterip",
    description: "Service type is `ClusterIP`",
    passed: svc.spec.type === "ClusterIP",
    hint: svc.spec.type !== "ClusterIP" ? `Type is currently \`${svc.spec.type}\`. Set \`spec.type: ClusterIP\`.` : undefined,
  });

  const hasPort80 = svc.spec.ports.some((p) => p.port === 80);
  results.push({
    id: "port-80",
    description: "Service exposes port 80",
    passed: hasPort80,
    hint: !hasPort80
      ? `No port 80 found. Add to \`spec.ports\`: \`- port: 80\ntargetPort: 80\`.`
      : undefined,
  });

  return results;
}
