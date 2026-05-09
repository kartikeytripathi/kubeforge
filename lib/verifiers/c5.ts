import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyC5(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const pas = sim.getCustomResources("PeerAuthentication", "payments");
  const pa = pas.find((r) => r.metadata.name === "payments-mtls");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "pa-exists",
    description: "PeerAuthentication `payments-mtls` exists in namespace `payments`",
    passed: !!pa,
    hint: pa
      ? undefined
      : "Apply a PeerAuthentication with `metadata.name: payments-mtls` and `metadata.namespace: payments`.",
  });

  if (!pa) {
    // check namespace
    const ns = sim.getNamespaces().find((n) => n.metadata.name === "payments");
    results.push({
      id: "mode-strict",
      description: "`mtls.mode` is `STRICT`",
      passed: false,
      hint: "Apply the PeerAuthentication first.",
    });
    results.push({
      id: "ns-exists",
      description: "Namespace `payments` exists",
      passed: !!ns,
      hint: ns ? undefined : "The namespace is created by the lab setup.",
    });
    return results;
  }

  const mode = pa.spec?.mtls?.mode;
  results.push({
    id: "mode-strict",
    description: "`mtls.mode` is `STRICT`",
    passed: mode === "STRICT",
    hint:
      mode !== "STRICT"
        ? `Current mode: \`${mode}\`. Change to \`STRICT\` to reject all plaintext connections.`
        : undefined,
  });

  const ns = sim.getNamespaces().find((n) => n.metadata.name === "payments");
  results.push({
    id: "ns-exists",
    description: "Namespace `payments` exists",
    passed: !!ns,
    hint: ns ? undefined : "Namespace `payments` should have been created by the lab setup.",
  });

  return results;
}
