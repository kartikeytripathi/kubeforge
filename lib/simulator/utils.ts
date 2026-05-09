import type { Labels } from "./types";

let _uidCounter = 0;
export function generateUid(): string {
  return `sim-${Date.now()}-${++_uidCounter}`;
}

export function labelsMatch(selector: Labels, podLabels: Labels): boolean {
  return Object.entries(selector).every(([k, v]) => podLabels[k] === v);
}

/** Hash a pod template so RS can detect spec changes */
export function templateHash(containers: { image: string; command?: string[] }[]): string {
  return containers
    .map((c) => `${c.image}:${(c.command ?? []).join(",")}`)
    .join("|");
}

/** Parse "500m" → 500, "2" → 2000 millicores */
export function parseCpu(cpu: string): number {
  if (cpu.endsWith("m")) return parseInt(cpu.slice(0, -1), 10);
  return parseFloat(cpu) * 1000;
}

/** Parse "256Mi" → 256, "1Gi" → 1024 MiB */
export function parseMemory(mem: string): number {
  if (mem.endsWith("Gi")) return parseFloat(mem) * 1024;
  if (mem.endsWith("Mi")) return parseFloat(mem);
  if (mem.endsWith("Ki")) return parseFloat(mem) / 1024;
  return parseFloat(mem) / (1024 * 1024);
}

const CRASHING_COMMANDS = [
  "exit 1",
  "/wrong-command",
  "/nonexistent",
  "/bad-cmd",
  "/usr/local/bin/app", // not in base images
];

const CRASHING_IMAGES = ["crash:latest", "broken:v1", "broken:latest"];

/** Determine if the container spec will cause a crash loop */
export function willCrash(container: { image: string; command?: string[]; args?: string[] }): boolean {
  if (CRASHING_IMAGES.includes(container.image)) return true;

  const cmdStr = [...(container.command ?? []), ...(container.args ?? [])].join(" ");
  return CRASHING_COMMANDS.some((p) => cmdStr.includes(p));
}
