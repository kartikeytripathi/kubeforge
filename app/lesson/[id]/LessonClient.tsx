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
  children: React.ReactNode; // server-rendered MDX concept content
}

export function LessonClient({ lab, labId, hiddenSetupYaml, children }: Props) {
  const verifier = VERIFIERS[labId] ?? noopVerifier;

  return (
    <div className="h-full overflow-hidden -m-6">
      <LabPane
        lab={lab}
        verifier={verifier}
        conceptContent={children}
        hiddenSetupYaml={hiddenSetupYaml}
      />
    </div>
  );
}
