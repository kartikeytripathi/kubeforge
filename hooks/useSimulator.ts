"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ClusterSimulator } from "@/lib/simulator";
import type { ClusterState } from "@/lib/simulator/types";

const TICK_INTERVAL_MS = 250;

export function useSimulator(initialYaml?: string) {
  const simRef = useRef<ClusterSimulator | null>(null);
  const [state, setState] = useState<ClusterState | null>(null);

  useEffect(() => {
    const sim = new ClusterSimulator();
    simRef.current = sim;

    // Apply hidden setup YAML if provided
    if (initialYaml) {
      try {
        sim.apply(initialYaml);
      } catch {
        // ignore parse errors in hidden setup
      }
    }

    setState(structuredClone(sim.getState()) as ClusterState);

    const unsub = sim.subscribe((newState) => setState(newState));

    const ticker = setInterval(() => {
      sim.tick();
    }, TICK_INTERVAL_MS);

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
    if (initialYaml) {
      try {
        simRef.current?.apply(initialYaml);
      } catch {
        // ignore
      }
    }
  }, [initialYaml]);

  return { state, applyYaml, reset, simulator: simRef };
}
