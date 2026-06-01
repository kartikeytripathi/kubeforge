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
import { verifyC1 } from "@/lib/verifiers/c1";
import { verifyC2 } from "@/lib/verifiers/c2";
import { verifyC3 } from "@/lib/verifiers/c3";
import { verifyC4 } from "@/lib/verifiers/c4";
import { verifyC5 } from "@/lib/verifiers/c5";
import { verifyC6 } from "@/lib/verifiers/c6";
import { verifyC7 } from "@/lib/verifiers/c7";
import { verifyC8 } from "@/lib/verifiers/c8";
import { verifyC9 } from "@/lib/verifiers/c9";
import { verifyC10 } from "@/lib/verifiers/c10";
import { verifyD1 } from "@/lib/verifiers/d1";
import { verifyD2 } from "@/lib/verifiers/d2";
import { verifyD3 } from "@/lib/verifiers/d3";
import { verifyD4 } from "@/lib/verifiers/d4";
import { verifyD5 } from "@/lib/verifiers/d5";
import { verifyD6 } from "@/lib/verifiers/d6";
import { verifyD7 } from "@/lib/verifiers/d7";
import { verifyD8 } from "@/lib/verifiers/d8";
import { verifyD9 } from "@/lib/verifiers/d9";
import { verifyD10 } from "@/lib/verifiers/d10";
import { verifyD11 } from "@/lib/verifiers/d11";
import { verifyD12 } from "@/lib/verifiers/d12";
import { verifyD13 } from "@/lib/verifiers/d13";
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
  c1: verifyC1,
  c2: verifyC2,
  c3: verifyC3,
  c4: verifyC4,
  c5: verifyC5,
  c6: verifyC6,
  c7: verifyC7,
  c8: verifyC8,
  c9: verifyC9,
  c10: verifyC10,
  d1: verifyD1,
  d2: verifyD2,
  d3: verifyD3,
  d4: verifyD4,
  d5: verifyD5,
  d6: verifyD6,
  d7: verifyD7,
  d8: verifyD8,
  d9: verifyD9,
  d10: verifyD10,
  d11: verifyD11,
  d12: verifyD12,
  d13: verifyD13,
};

const noopVerifier: VerifierFn = () => [];

interface Props {
  lab: LabDefinition;
  labId: string;
  hiddenSetupYaml?: string;
  scenarioHtml: string;
  scenarioText: string;
}

export function LessonClient({ lab, labId, hiddenSetupYaml, scenarioHtml, scenarioText }: Props) {
  const verifier = VERIFIERS[labId] ?? noopVerifier;

  return (
    <LabPane
      lab={lab}
      verifier={verifier}
      hiddenSetupYaml={hiddenSetupYaml}
      scenarioHtml={scenarioHtml}
      scenarioText={scenarioText}
    />
  );
}
