import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

export function verifyC8(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const backups = sim.getCustomResources("Backup", "velero");
  const backup = backups.find((r) => r.metadata.name === "production-backup");
  const results: ObjectiveResult[] = [];

  results.push({
    id: "backup-exists",
    description: "Velero Backup `production-backup` exists in namespace `velero`",
    passed: !!backup,
    hint: backup
      ? undefined
      : "Apply a Velero Backup with `metadata.name: production-backup` and `metadata.namespace: velero`.",
  });

  if (backup) {
    const ns: string[] = backup.spec?.includedNamespaces ?? [];
    results.push({
      id: "backup-ns",
      description: "Backup includes namespace `production` (not `staging`)",
      passed: ns.includes("production"),
      hint: !ns.includes("production")
        ? `includedNamespaces is currently: ${JSON.stringify(ns)}. Change \`staging\` to \`production\`.`
        : undefined,
    });
  } else {
    results.push({
      id: "backup-ns",
      description: "Backup includes namespace `production` (not `staging`)",
      passed: false,
      hint: "Apply the Backup first.",
    });
  }

  const restores = sim.getCustomResources("Restore", "velero");
  const restore = restores.find((r) => r.metadata.name === "production-restore");

  results.push({
    id: "restore-exists",
    description: "Velero Restore `production-restore` exists in namespace `velero`",
    passed: !!restore,
    hint: restore
      ? undefined
      : "Add a Restore CR (`kind: Restore`) with `metadata.name: production-restore` in a second YAML document.",
  });

  results.push({
    id: "restore-ref",
    description: "Restore references backup `production-backup`",
    passed: restore?.spec?.backupName === "production-backup",
    hint:
      restore && restore.spec?.backupName !== "production-backup"
        ? `spec.backupName is \`${restore.spec?.backupName}\`. Set to \`production-backup\`.`
        : undefined,
  });

  return results;
}
