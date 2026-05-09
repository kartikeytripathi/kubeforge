"use client";

import { LabPane } from "@/components/LabPane";
import { verifyA1 } from "@/lib/verifiers/a1";
import { verifyA2 } from "@/lib/verifiers/a2";
import { verifyA3 } from "@/lib/verifiers/a3";
import type { LabDefinition, VerifierFn } from "@/lib/verifiers/types";

const VERIFIERS: Record<string, VerifierFn> = {
  a1: verifyA1,
  a2: verifyA2,
  a3: verifyA3,
};

const noopVerifier: VerifierFn = () => [];

interface Props {
  lab: LabDefinition;
  labId: string;
  hiddenSetupYaml?: string;
}

export function LessonClient({ lab, labId, hiddenSetupYaml }: Props) {
  const verifier = VERIFIERS[labId] ?? noopVerifier;

  return (
    <LabPane
      lab={lab}
      verifier={verifier}
      hiddenSetupYaml={hiddenSetupYaml}
    />
  );
}
