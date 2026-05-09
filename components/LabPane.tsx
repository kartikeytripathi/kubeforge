"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { YamlEditor } from "./YamlEditor";
import { ClusterCanvas } from "./ClusterCanvas";
import { VerifyPanel } from "./VerifyPanel";
import { useSimulator } from "@/hooks/useSimulator";
import type { LabDefinition } from "@/lib/verifiers/types";
import type { ObjectiveResult, VerifierFn } from "@/lib/verifiers/types";

interface Props {
  lab: LabDefinition;
  verifier: VerifierFn;
  hiddenSetupYaml?: string;
}

export function LabPane({ lab, verifier, hiddenSetupYaml }: Props) {
  const [yaml, setYaml] = useState(lab.starterYaml);
  const [results, setResults] = useState<ObjectiveResult[] | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const { state, applyYaml, reset, simulator } = useSimulator(hiddenSetupYaml);

  // Elapsed timer for hint reveal
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 5000);
    return () => clearInterval(t);
  }, []);

  // Debounced auto-apply as user types
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleYamlChange = useCallback(
    (value: string) => {
      setYaml(value);
      setApplyError(null);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const { error } = applyYaml(value);
        if (error) setApplyError(error);
      }, 500);
    },
    [applyYaml]
  );

  const handleVerify = useCallback(() => {
    if (!simulator.current) return;
    setIsVerifying(true);
    // Run verifier in next tick so UI updates first
    setTimeout(() => {
      const r = verifier(simulator.current!, yaml);
      setResults(r);
      if (!r.every((x) => x.passed)) setFailCount((c) => c + 1);
      setIsVerifying(false);
    }, 50);
  }, [simulator, verifier, yaml]);

  // Keyboard shortcut ⌘/Ctrl + Enter = verify
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleVerify();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleVerify]);

  const handleRevealSolution = useCallback(() => {
    setYaml(lab.solution);
    const { error } = applyYaml(lab.solution);
    if (error) setApplyError(error);
  }, [lab.solution, applyYaml]);

  const handleReset = useCallback(() => {
    reset();
    setYaml(lab.starterYaml);
    setResults(null);
    setFailCount(0);
    setApplyError(null);
    startTimeRef.current = Date.now();
  }, [reset, lab.starterYaml]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Lab header */}
      <div className="flex items-center justify-between border-b border-surface-600 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500 uppercase">{lab.id.toUpperCase()}</span>
          <h2 className="text-sm font-semibold text-white">{lab.title}</h2>
          {lab.realWorldIncident && (
            <span className="rounded-full bg-orange-600/20 px-2 py-0.5 text-xs font-semibold text-orange-400">
              🔥 Real-world incident
            </span>
          )}
          <span className="rounded-full border border-surface-600 px-2 py-0.5 text-xs text-gray-400 capitalize">
            {lab.difficulty}
          </span>
          <span className="text-xs text-gray-500">~{lab.estimatedMinutes} min</span>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ↺ Reset
        </button>
      </div>

      {/* Editor + canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center: YAML editor */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden p-2">
            <YamlEditor value={yaml} onChange={handleYamlChange} />
          </div>
          {applyError && (
            <div className="border-t border-red-800/50 bg-red-900/20 px-4 py-2 text-xs text-red-400">
              YAML parse error: {applyError}
            </div>
          )}
        </div>

        {/* Right: Cluster canvas */}
        <div className="w-[380px] shrink-0 overflow-hidden border-l border-surface-600 p-2">
          <ClusterCanvas clusterState={state} />
        </div>
      </div>

      {/* Bottom: verify panel */}
      <div className="border-t border-surface-600 bg-surface-900 px-4 py-3">
        <VerifyPanel
          results={results}
          isVerifying={isVerifying}
          onVerify={handleVerify}
          onRevealSolution={handleRevealSolution}
          failCount={failCount}
          hints={lab.hints}
          elapsedMs={elapsed}
        />
      </div>
    </div>
  );
}
