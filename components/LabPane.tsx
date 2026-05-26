"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { YamlEditor } from "./YamlEditor";
import { ClusterCanvas } from "./ClusterCanvas";
import { VerifyPanel } from "./VerifyPanel";
import { useSimulator } from "@/hooks/useSimulator";
import { useProgressStore } from "@/lib/progress-store";
import type { LabDefinition } from "@/lib/verifiers/types";
import type { ObjectiveResult, VerifierFn } from "@/lib/verifiers/types";

const KubectlTerminal = dynamic(
  () => import("./KubectlTerminal").then((m) => m.KubectlTerminal),
  { ssr: false }
);

interface Props {
  lab: LabDefinition;
  verifier: VerifierFn;
  hiddenSetupYaml?: string;
}

type PanelTab = "canvas" | "terminal";

export function LabPane({ lab, verifier, hiddenSetupYaml }: Props) {
  const [yaml, setYaml] = useState(lab.starterYaml);
  const [results, setResults] = useState<ObjectiveResult[] | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>("canvas");
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const completedRef = useRef(false);

  const { state, applyYaml, reset, simulator } = useSimulator(hiddenSetupYaml);
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const recordCompletion = useProgressStore((s) => s.recordCompletion);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 5000);
    return () => clearInterval(t);
  }, []);

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
    setTimeout(() => {
      const r = verifier(simulator.current!, yaml);
      setResults(r);
      const allPassed = r.every((x) => x.passed);

      recordAttempt(lab.id, allPassed);
      fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labId: lab.id, yaml, passed: allPassed }),
      }).catch(() => {});

      if (!allPassed) {
        setFailCount((c) => c + 1);
      } else if (!completedRef.current) {
        completedRef.current = true;
        const durationMs = Date.now() - startTimeRef.current;
        recordCompletion(lab.id, durationMs);
        fetch("/api/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labId: lab.id, durationMs }),
        }).catch(() => {});
      }
      setIsVerifying(false);
    }, 50);
  }, [simulator, verifier, yaml, lab.id, recordAttempt, recordCompletion]);

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
    completedRef.current = false;
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
              Real-world incident
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
          Reset
        </button>
      </div>

      {/* Editor + right panel */}
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

        {/* Right: tabbed panel (canvas / terminal) */}
        <div className="flex w-[380px] shrink-0 flex-col border-l border-surface-600">
          {/* Tab bar */}
          <div className="flex border-b border-surface-600">
            {(["canvas", "terminal"] as PanelTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-teal-500 text-teal-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "canvas" ? "Cluster View" : "kubectl"}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden p-2">
            {activeTab === "canvas" ? (
              <ClusterCanvas clusterState={state} />
            ) : (
              <KubectlTerminal simulator={simulator.current} />
            )}
          </div>
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
