import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD3(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  // ServiceAccount annotations are stored as a CustomResource since SimServiceAccount doesn't have annotations
  const saResources = sim.getCustomResources("ServiceAccount", "default");
  const sa = saResources.find((r) => r.metadata.name === "s3-reader");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "sa-exists",
    description: "ServiceAccount `s3-reader` exists in `default`",
    passed: !!sa,
    hint: sa ? undefined : "Apply a ServiceAccount with `metadata.name: s3-reader` and `metadata.namespace: default`.",
  });

  if (!sa) return results;

  const annotations = sa.metadata.annotations ?? {};
  const hasIrsa = "eks.amazonaws.com/role-arn" in annotations;
  const hasPodIdentity = "eks.amazonaws.com/pod-identity-association" in annotations;
  const arnValue: string = annotations["eks.amazonaws.com/pod-identity-association"] ?? annotations["eks.amazonaws.com/role-arn"] ?? "";

  results.push({
    id: "no-irsa",
    description: "IRSA annotation (`eks.amazonaws.com/role-arn`) is NOT present",
    passed: !hasIrsa,
    hint: hasIrsa
      ? "Remove the `eks.amazonaws.com/role-arn` annotation — it's the IRSA annotation being replaced."
      : undefined,
  });

  results.push({
    id: "has-pod-identity",
    description: "Pod Identity annotation (`eks.amazonaws.com/pod-identity-association`) IS present",
    passed: hasPodIdentity,
    hint: !hasPodIdentity
      ? "Add annotation `eks.amazonaws.com/pod-identity-association` with the IAM role ARN as the value."
      : undefined,
  });

  results.push({
    id: "arn-preserved",
    description: "IAM role ARN starts with `arn:aws:iam::`",
    passed: arnValue.startsWith("arn:aws:iam::"),
    hint: !arnValue.startsWith("arn:aws:iam::")
      ? `The annotation value must be a valid IAM role ARN starting with \`arn:aws:iam::\`. Current value: \`${arnValue || "unset"}\`.`
      : undefined,
  });

  return results;
}
