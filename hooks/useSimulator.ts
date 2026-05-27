"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ClusterSimulator } from "@/lib/simulator";
import type { ClusterState } from "@/lib/simulator/types";

const TICK_INTERVAL_MS = 250;

export function useSimulator(hiddenSetupYaml?: string, starterYaml?: string) {
  const simRef = useRef<ClusterSimulator | null>(null);
  const [state, setState] = useState<ClusterState | null>(null);

  useEffect(() => {
    const sim = new ClusterSimulator();
    simRef.current = sim;

    // Apply hidden setup first (pre-existing broken state), then starter YAML
    // so the simulator reflects what the editor already shows on first load.
    if (hiddenSetupYaml) {
      try { sim.apply(hiddenSetupYaml); } catch { /* ignore */ }
    }
    if (starterYaml) {
      try { sim.apply(starterYaml); } catch { /* ignore */ }
    }

    setState(structuredClone(sim.getState()) as ClusterState);

    const unsub = sim.subscribe((newState) => setState(newState));
    const ticker = setInterval(() => { sim.tick(); }, TICK_INTERVAL_MS);

    return () => {
      clearInterval(ticker);
      unsub();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyYaml = useCallback((rawYaml: string): { error: string | null } => {
    if (!simRef.current) return { error: "Simulator not ready" };
    try {
      simRef.current.apply(rawYaml);
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, []);

  const reset = useCallback(() => {
    simRef.current?.reset();
    if (hiddenSetupYaml) {
      try { simRef.current?.apply(hiddenSetupYaml); } catch { /* ignore */ }
    }
    if (starterYaml) {
      try { simRef.current?.apply(starterYaml); } catch { /* ignore */ }
    }
  }, [hiddenSetupYaml, starterYaml]);

  return { state, applyYaml, reset, simulator: simRef };
}
