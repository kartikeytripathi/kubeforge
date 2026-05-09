import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyD8(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const cms = sim.getConfigMaps("default");
  const cm = cms.find((c) => c.metadata.name === "ecr-cross-account-policy");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "cm-exists",
    description: "ConfigMap `ecr-cross-account-policy` exists in `default`",
    passed: !!cm,
    hint: cm ? undefined : "Apply a ConfigMap named `ecr-cross-account-policy` in the `default` namespace.",
  });

  const policyJson = cm?.data?.["policy.json"] ?? "";
  let policy: any = null;
  try { policy = JSON.parse(policyJson); } catch { /* invalid JSON */ }

  const statements: any[] = policy?.Statement ?? [];
  const hasStatement = statements.length > 0;

  results.push({
    id: "has-statement",
    description: "`policy.json` contains a cross-account IAM statement",
    passed: hasStatement,
    hint: hasStatement ? undefined : "Add at least one Statement to `policy.json`. The Statement should grant the workload account permission to pull images.",
  });

  const allowsBatchGet = statements.some((s: any) => {
    const actions: string[] = Array.isArray(s.Action) ? s.Action : [s.Action];
    return s.Effect === "Allow" && actions.includes("ecr:BatchGetImage");
  });

  results.push({
    id: "allows-pull",
    description: "`policy.json` allows `ecr:BatchGetImage`",
    passed: allowsBatchGet,
    hint: allowsBatchGet
      ? undefined
      : "Make sure the Statement has `\"Effect\": \"Allow\"` and includes `\"ecr:BatchGetImage\"` in the Action list.",
  });

  const hasPrincipal = statements.some((s: any) => {
    const principal = s.Principal?.AWS ?? "";
    const principals = Array.isArray(principal) ? principal : [principal];
    return principals.some((p: string) => /arn:aws:iam::\d+:root/.test(p));
  });

  results.push({
    id: "has-principal",
    description: "Principal contains a valid AWS account ARN",
    passed: hasPrincipal,
    hint: hasPrincipal
      ? undefined
      : "Set `Principal.AWS` to `arn:aws:iam::999888777666:root` to grant access to all principals in the workload account.",
  });

  return results;
}
