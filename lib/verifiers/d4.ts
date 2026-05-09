import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD4(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const ingresses = sim.getIngresses("default");
  const ingress = ingresses.find((i) => i.metadata.name === "payment-ingress");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "ingress-exists",
    description: "Ingress `payment-ingress` exists in `default`",
    passed: !!ingress,
    hint: ingress ? undefined : "Apply an Ingress with `metadata.name: payment-ingress`.",
  });

  if (!ingress) return results;

  const annotations = ingress.metadata.annotations ?? {};

  results.push({
    id: "scheme-public",
    description: "Scheme annotation is `internet-facing`",
    passed: annotations["alb.ingress.kubernetes.io/scheme"] === "internet-facing",
    hint:
      annotations["alb.ingress.kubernetes.io/scheme"] !== "internet-facing"
        ? `Scheme is \`${annotations["alb.ingress.kubernetes.io/scheme"] ?? "unset"}\`. Change to \`internet-facing\` to create a public-facing ALB.`
        : undefined,
  });

  const certArn = annotations["alb.ingress.kubernetes.io/certificate-arn"] ?? "";
  results.push({
    id: "cert-valid",
    description: "Certificate ARN starts with `arn:aws:acm:`",
    passed: certArn.startsWith("arn:aws:acm:"),
    hint: !certArn.startsWith("arn:aws:acm:")
      ? `Certificate ARN is \`${certArn || "unset"}\`. Use a valid ACM ARN: \`arn:aws:acm:REGION:ACCOUNT:certificate/ID\`.`
      : undefined,
  });

  results.push({
    id: "class-alb",
    description: "`ingressClassName` is `alb`",
    passed: ingress.spec.ingressClassName === "alb",
    hint:
      ingress.spec.ingressClassName !== "alb"
        ? `ingressClassName is \`${ingress.spec.ingressClassName ?? "unset"}\`. Set to \`alb\`.`
        : undefined,
  });

  return results;
}
