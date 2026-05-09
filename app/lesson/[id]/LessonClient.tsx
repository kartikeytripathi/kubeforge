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
import { verifyB1 } from "@/lib/verifiers/b1";
import { verifyB2 } from "@/lib/verifiers/b2";
import { verifyB3 } from "@/lib/verifiers/b3";
import { verifyB4 } from "@/lib/verifiers/b4";
import { verifyB5 } from "@/lib/verifiers/b5";
import { verifyB6 } from "@/lib/verifiers/b6";
import { verifyB7 } from "@/lib/verifiers/b7";
import { verifyB8 } from "@/lib/verifiers/b8";
import { verifyB9 } from "@/lib/verifiers/b9";
import { verifyB10 } from "@/lib/verifiers/b10";
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
  b1: verifyB1,
  b2: verifyB2,
  b3: verifyB3,
  b4: verifyB4,
  b5: verifyB5,
  b6: verifyB6,
  b7: verifyB7,
  b8: verifyB8,
  b9: verifyB9,
  b10: verifyB10,
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
