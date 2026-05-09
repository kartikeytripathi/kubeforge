import type { ClusterSimulator } from "@/lib/simulator";

export interface ObjectiveResult {
  id: string;
  description: string;
  passed: boolean;
  hint?: string;
}

export type VerifierFn = (sim: ClusterSimulator, submittedYaml: string) => ObjectiveResult[];

export interface LabDefinition {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  scenario: string;
  starterYaml: string;
  objectives: { id: string; description: string }[];
  hints: { revealAfterMs?: number; text: string }[];
  solution: string;
  realWorldIncident?: boolean;
}
