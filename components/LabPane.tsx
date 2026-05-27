"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { YamlEditor } from "./YamlEditor";
import { ClusterCanvas } from "./ClusterCanvas";
import { VerifyPanel } from "./VerifyPanel";
import { useSimulator } from "@/hooks/useSimulator";
import { useProgressStore } from "@/lib/progress-store";
import type { LabDefinition, ObjectiveResult, VerifierFn } from "@/lib/verifiers/types";

const KubectlTerminal = dynamic(
  () => import("./KubectlTerminal").then((m) => m.KubectlTerminal),
  { ssr: false }
);

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconChevronLeft() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 12L6 8l4-4" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
    </svg>
  );
}
function IconHexagon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M8 2L13.5 5v6L8 14 2.5 11V5L8 2z" />
    </svg>
  );
}
function IconTerminal() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4l4 4-4 4M9 12h4" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 2v4h4" />
    </svg>
  );
}
function IconScenario() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="2" width="12" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M5 6h6M5 9h4" />
    </svg>
  );
}

// ─── Drag handle ─────────────────────────────────────────────────────────────

function DragHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="group relative w-1 shrink-0 cursor-col-resize select-none bg-surface-700 transition-colors hover:bg-teal-600/70 active:bg-teal-500"
      title="Drag to resize"
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}

// ─── Collapsed side panel strip ───────────────────────────────────────────────

function CollapsedStrip({
  label,
  side,
  onExpand,
}: {
  label: string;
  side: "left" | "right";
  onExpand: () => void;
}) {
  return (
    <div
      className={`flex w-9 shrink-0 flex-col items-center justify-between py-3 bg-surface-900 ${
        side === "left" ? "border-r" : "border-l"
      } border-surface-600`}
    >
      <button
        onClick={onExpand}
        className="text-gray-500 hover:text-teal-400 transition-colors p-1"
        title={`Expand ${label}`}
      >
        {side === "left" ? <IconChevronRight /> : <IconChevronLeft />}
      </button>
      <span
        className="text-[10px] font-mono text-gray-600 tracking-widest"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
      >
        {label}
      </span>
      <div />
    </div>
  );
}

// ─── Panel header ─────────────────────────────────────────────────────────────

function PanelHeader({
  icon,
  label,
  right,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-surface-600 bg-surface-800 px-3">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
        <span className="text-gray-500">{icon}</span>
        {label}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

type PanelTab = "canvas" | "terminal";

function TabBar({
  active,
  onChange,
  onCollapse,
}: {
  active: PanelTab;
  onChange: (t: PanelTab) => void;
  onCollapse: () => void;
}) {
  const tabs: { id: PanelTab; icon: React.ReactNode; label: string }[] = [
    { id: "canvas",   icon: <IconHexagon />,  label: "Cluster View" },
    { id: "terminal", icon: <IconTerminal />, label: "kubectl" },
  ];
  return (
    <div className="flex h-9 shrink-0 items-stretch border-b border-surface-600 bg-surface-800">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 px-4 text-xs font-medium transition-colors border-b-2 ${
            active === t.id
              ? "border-teal-500 text-teal-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
      <div className="ml-auto flex items-center pr-2">
        <button
          onClick={onCollapse}
          className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
          title="Collapse panel"
        >
          <IconChevronRight />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  lab: LabDefinition;
  verifier: VerifierFn;
  hiddenSetupYaml?: string;
  scenarioHtml: string;
  scenarioText: string;
}

export function LabPane({ lab, verifier, hiddenSetupYaml, scenarioHtml, scenarioText }: Props) {
  const [yaml, setYaml]             = useState(lab.starterYaml);
  const [results, setResults]       = useState<ObjectiveResult[] | null>(null);
  const [failCount, setFailCount]   = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<PanelTab>("canvas");
  const [elapsed, setElapsed]       = useState(0);

  // Panel sizing
  const [leftWidth, setLeftWidth]     = useState(320);
  const [rightWidth, setRightWidth]   = useState(360);
  const [leftCollapsed, setLeftCollapsed]   = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const startTimeRef   = useRef(Date.now());
  const completedRef   = useRef(false);
  const dragStateRef   = useRef<{ type: "left" | "right"; startX: number; startWidth: number } | null>(null);

  const { state, applyYaml, reset, simulator } = useSimulator(hiddenSetupYaml);
  const recordAttempt    = useProgressStore((s) => s.recordAttempt);
  const recordCompletion = useProgressStore((s) => s.recordCompletion);

  // Timer for hints
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 5000);
    return () => clearInterval(t);
  }, []);

  // Global drag resize listeners
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const d = dragStateRef.current;
      if (!d) return;
      const delta = e.clientX - d.startX;
      if (d.type === "left") {
        setLeftWidth(Math.max(200, Math.min(520, d.startWidth + delta)));
      } else {
        setRightWidth(Math.max(200, Math.min(560, d.startWidth - delta)));
      }
    }
    function onMouseUp() { dragStateRef.current = null; }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function startDrag(type: "left" | "right", e: React.MouseEvent, currentWidth: number) {
    e.preventDefault();
    dragStateRef.current = { type, startX: e.clientX, startWidth: currentWidth };
  }

  // YAML debounce
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
    // Always apply current editor content before verifying — the debounce-based
    // auto-apply only fires on edit, so a user who hasn't typed anything yet
    // would be verified against a stale simulator state.
    simulator.current.apply(yaml);
    // Force enough ticks for refs to resolve and pods to transition (START_TICKS = 3)
    for (let i = 0; i < 6; i++) simulator.current.tick();
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

      {/* ── Lab header ──────────────────────────────────────────────────── */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-surface-600 bg-surface-900 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 rounded bg-surface-700 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-teal-400 uppercase tracking-wider">
            {lab.id.toUpperCase()}
          </span>
          <h2 className="truncate text-sm font-semibold text-white">{lab.title}</h2>
          {lab.realWorldIncident && (
            <span className="shrink-0 rounded-full bg-orange-600/20 px-2 py-0.5 text-xs font-semibold text-orange-400">
              Real-world
            </span>
          )}
          <span className="shrink-0 rounded-full border border-surface-600 px-2 py-0.5 text-xs text-gray-400 capitalize">
            {lab.difficulty}
          </span>
          <span className="shrink-0 text-xs text-gray-600">~{lab.estimatedMinutes} min</span>
        </div>
        <button
          onClick={handleReset}
          className="shrink-0 text-xs text-gray-600 hover:text-gray-300 transition-colors ml-4"
        >
          Reset
        </button>
      </div>

      {/* ── Main three-column layout ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Scenario ─────────────────────────────────────────────── */}
        {leftCollapsed ? (
          <CollapsedStrip label="Scenario" side="left" onExpand={() => setLeftCollapsed(false)} />
        ) : (
          <div
            className="flex shrink-0 flex-col overflow-hidden border-r border-surface-600 bg-surface-900"
            style={{ width: leftWidth }}
          >
            <PanelHeader
              icon={<IconScenario />}
              label={<span className="font-semibold tracking-wide">Scenario</span>}
              right={
                <button
                  onClick={() => setLeftCollapsed(true)}
                  className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
                  title="Collapse panel"
                >
                  <IconChevronLeft />
                </button>
              }
            />
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Scenario box */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-amber-400">⚡</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Scenario
                  </span>
                </div>
                <p className="text-xs text-amber-200/80 leading-relaxed">{scenarioText}</p>
              </div>

              {/* Concept content */}
              <div
                className="prose prose-sm prose-invert max-w-none text-gray-300
                  [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-white [&_h2]:border-b [&_h2]:border-surface-600 [&_h2]:pb-1
                  [&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-gray-200 [&_h3]:uppercase [&_h3]:tracking-wider
                  [&_p]:text-xs [&_p]:leading-relaxed [&_p]:text-gray-400
                  [&_li]:text-xs [&_li]:text-gray-400 [&_li]:leading-relaxed
                  [&_code]:rounded [&_code]:bg-surface-700 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11px] [&_code]:text-teal-400 [&_code]:font-mono
                  [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-surface-600 [&_pre]:bg-surface-800 [&_pre]:p-3 [&_pre]:text-[11px] [&_pre]:overflow-x-auto
                  [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-300
                  [&_table]:text-xs [&_table]:w-full [&_table]:border-collapse
                  [&_th]:border [&_th]:border-surface-600 [&_th]:bg-surface-800 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-gray-300 [&_th]:font-semibold
                  [&_td]:border [&_td]:border-surface-600 [&_td]:px-2 [&_td]:py-1.5 [&_td]:text-gray-400
                  [&_a]:text-teal-400 [&_a]:underline
                  [&_blockquote]:border-l-2 [&_blockquote]:border-teal-600 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_blockquote]:italic
                  [&_ul]:space-y-0.5 [&_ul]:pl-4 [&_ol]:space-y-0.5 [&_ol]:pl-4
                  [&_hr]:border-surface-600"
                dangerouslySetInnerHTML={{ __html: scenarioHtml }}
              />
            </div>
          </div>
        )}

        {/* ── Drag handle: left / editor ──────────────────────────────────── */}
        {!leftCollapsed && (
          <DragHandle onMouseDown={(e) => startDrag("left", e, leftWidth)} />
        )}

        {/* ── CENTER: YAML Editor ─────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <PanelHeader
            icon={<IconFile />}
            label={
              <>
                <span className="font-mono text-gray-400">manifest.yaml</span>
                <span className="rounded border border-surface-600 px-1.5 py-0.5 text-[10px] font-mono text-gray-600">
                  YAML
                </span>
              </>
            }
            right={
              applyError ? (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  Parse error
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600 shrink-0" />
                  Valid
                </span>
              )
            }
          />

          <div className="flex-1 overflow-hidden p-2">
            <YamlEditor value={yaml} onChange={handleYamlChange} />
          </div>

          {applyError && (
            <div className="flex items-start gap-2 border-t border-red-800/50 bg-red-900/20 px-4 py-2">
              <span className="mt-0.5 shrink-0 text-red-500">⚠</span>
              <p className="text-xs text-red-400 leading-relaxed font-mono">{applyError}</p>
            </div>
          )}
        </div>

        {/* ── Drag handle: editor / right ──────────────────────────────────── */}
        {!rightCollapsed && (
          <DragHandle onMouseDown={(e) => startDrag("right", e, rightWidth)} />
        )}

        {/* ── RIGHT: Cluster View / kubectl ───────────────────────────────── */}
        {rightCollapsed ? (
          <CollapsedStrip label="Cluster" side="right" onExpand={() => setRightCollapsed(false)} />
        ) : (
          <div
            className="flex shrink-0 flex-col overflow-hidden border-l border-surface-600"
            style={{ width: rightWidth }}
          >
            <TabBar
              active={activeTab}
              onChange={setActiveTab}
              onCollapse={() => setRightCollapsed(true)}
            />

            {/* Legend (only in cluster view) */}
            {activeTab === "canvas" && (
              <div className="flex items-center gap-3 border-b border-surface-600 bg-surface-900 px-3 py-1.5">
                {[
                  { color: "bg-green-500",  label: "Running" },
                  { color: "bg-yellow-500", label: "Pending" },
                  { color: "bg-red-500",    label: "CrashLoop" },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${color}`} />
                    {label}
                  </span>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-hidden p-2">
              {activeTab === "canvas" ? (
                <ClusterCanvas clusterState={state} />
              ) : (
                <KubectlTerminal simulator={simulator.current} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom: verify panel ─────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-surface-600 bg-surface-900 px-4 py-3">
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
