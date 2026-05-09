import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyC1(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const crds = sim.getCRDs();
  const crd = crds.find((c) => c.metadata.name === "echoes.kubeforge.io");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "crd-exists",
    description: "CRD `echoes.kubeforge.io` is registered",
    passed: !!crd,
    hint: crd ? undefined : "Apply a CustomResourceDefinition with `metadata.name: echoes.kubeforge.io`.",
  });

  if (!crd) return results;

  results.push({
    id: "crd-group",
    description: "CRD group is `kubeforge.io` (not `kubeforge.wrong`)",
    passed: crd.spec.group === "kubeforge.io",
    hint: crd.spec.group !== "kubeforge.io"
      ? `Current group: \`${crd.spec.group}\`. Change \`spec.group\` to \`kubeforge.io\`.`
      : undefined,
  });

  results.push({
    id: "crd-namespaced",
    description: "CRD scope is `Namespaced`",
    passed: crd.spec.scope === "Namespaced",
    hint: crd.spec.scope !== "Namespaced" ? "Set `spec.scope: Namespaced`." : undefined,
  });

  const crs = sim.getCustomResources("Echo", "default");
  const cr = crs.find((r) => r.metadata.name === "hello-echo");

  results.push({
    id: "cr-exists",
    description: "CR `hello-echo` of kind `Echo` exists in the `default` namespace",
    passed: !!cr,
    hint: cr
      ? undefined
      : "Add a second YAML document (after ---) with `apiVersion: kubeforge.io/v1`, `kind: Echo`, `metadata.name: hello-echo`.",
  });

  return results;
}
