import type { ClusterSimulator } from "@/lib/simulator";
import type { ObjectiveResult } from "./types";

function isValidCronSchedule(schedule: string): boolean {
  const fields = schedule.trim().split(/\s+/);
  return fields.length === 5;
}

export function verifyB6(sim: ClusterSimulator, _yaml: string): ObjectiveResult[] {
  const results: ObjectiveResult[] = [];
  const jobs = sim.getJobs("default");
  const job = jobs.find((j) => j.metadata.name === "db-migrate");

  results.push({
    id: "job-exists",
    description: "Job `db-migrate` exists in the `default` namespace",
    passed: !!job,
    hint: !job ? "Apply a `batch/v1` Job manifest with `metadata.name: db-migrate`." : undefined,
  });

  if (job) {
    results.push({
      id: "job-completions",
      description: "Job `completions` is set to `1`",
      passed: (job.spec.completions ?? 1) === 1,
      hint: (job.spec.completions ?? 1) !== 1
        ? `Current completions: ${job.spec.completions}. Set \`spec.completions: 1\` or omit it (defaults to 1).`
        : undefined,
    });

    const jobPods = sim.getPods({ namespace: "default" }).filter(
      (p) => p.metadata.ownerReference?.uid === job.metadata.uid
    );
    const succeeded = jobPods.some((p) => p.status.phase === "Succeeded") || job.status.succeeded > 0;

    results.push({
      id: "job-succeeded",
      description: "Job pod has `Succeeded` status",
      passed: succeeded,
      hint: !succeeded
        ? "Job pod hasn't completed yet. Wait a moment — Job pods run to completion, then transition to Succeeded."
        : undefined,
    });
  } else {
    results.push({ id: "job-completions", description: "Job `completions` is set to `1`", passed: false });
    results.push({ id: "job-succeeded", description: "Job pod has `Succeeded` status", passed: false });
  }

  const cronJobs = sim.getCronJobs("default");
  const cj = cronJobs.find((c) => c.metadata.name === "db-backup");

  results.push({
    id: "cronjob-exists",
    description: "CronJob `db-backup` exists in the `default` namespace",
    passed: !!cj,
    hint: !cj ? "Apply a `batch/v1` CronJob manifest with `metadata.name: db-backup`." : undefined,
  });

  results.push({
    id: "cronjob-schedule",
    description: "CronJob schedule is a valid 5-field cron expression",
    passed: !!cj && isValidCronSchedule(cj.spec.schedule),
    hint: cj && !isValidCronSchedule(cj.spec.schedule)
      ? `Schedule \`${cj.spec.schedule}\` is not a valid 5-field cron expression. Example: \`"0 2 * * *"\` (daily at 02:00).`
      : !cj
      ? "Create the CronJob first."
      : undefined,
  });

  return results;
}
