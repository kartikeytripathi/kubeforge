"use client";

import { LabPane } from "@/components/LabPane";
import { verifyA1 } from "@/lib/verifiers/a1";
import { verifyA2 } from "@/lib/verifiers/a2";
import { verifyA3 } from "@/lib/verifiers/a3";
import { verifyA4 } from "@/lib/verifiers/a4";
import { verifyA5 } from "@/lib/verifiers/a5";
import { verifyA6 } from "@/lib/verifiers/a6";
import { verifyA7 } from "@/lib/verifiers/a7";
import { verifyA8 } from "@/lib/verifiers/a8";
import type { LabDefinition, VerifierFn } from "@/lib/verifiers/types";

const VERIFIERS: Record<string, VerifierFn> = {
  a1: verifyA1,
  a2: verifyA2,
  a3: verifyA3,
  a4: verifyA4,
  a5: verifyA5,
  a6: verifyA6,
  a7: verifyA7,
  a8: verifyA8,
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
