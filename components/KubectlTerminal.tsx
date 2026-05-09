"use client";

import { useEffect, useRef } from "react";
import type { ClusterSimulator } from "@/lib/simulator";
import { executeKubectl } from "@/lib/kubectl-parser";

interface Props {
  simulator: ClusterSimulator | null;
}

export function KubectlTerminal({ simulator }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const termRef = useRef<any>(null);
  const simRef = useRef<ClusterSimulator | null>(simulator);
  const inputRef = useRef("");
  const historyRef = useRef<string[]>([]);
  const histIdxRef = useRef(-1);

  // Keep simRef current without remounting terminal
  simRef.current = simulator;

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let term: any = null;
    let observer: ResizeObserver | null = null;

    const writePrompt = () => termRef.current?.write("\r\n\x1b[32m$\x1b[0m ");

    const runCommand = (cmd: string) => {
      if (!termRef.current) return;
      const trimmed = cmd.trim();
      if (trimmed) {
        historyRef.current.unshift(trimmed);
        if (historyRef.current.length > 50) historyRef.current.length = 50;
      }
      histIdxRef.current = -1;

      if (!trimmed) { writePrompt(); return; }

      if (trimmed === "clear" || trimmed === "cls") {
        termRef.current.clear();
        writePrompt();
        return;
      }

      const result = simRef.current
        ? executeKubectl(simRef.current, trimmed)
        : { output: "Simulator not ready yet.", error: true };

      termRef.current.write("\r\n");
      if (result.output) {
        const colored = result.error ? `\x1b[31m${result.output}\x1b[0m` : result.output;
        termRef.current.write(colored.split("\n").join("\r\n"));
      }
      writePrompt();
    };

    (async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      // xterm.css is loaded via global stylesheet — no dynamic import needed

      if (disposed || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      term = new (Terminal as any)({
        theme: {
          background: "#0f1117",
          foreground: "#d1d5db",
          cursor: "#5eead4",
          selectionBackground: "#374151",
          red: "#f87171",
          green: "#34d399",
          yellow: "#fbbf24",
          blue: "#60a5fa",
          cyan: "#5eead4",
          white: "#d1d5db",
          brightWhite: "#f9fafb",
        },
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        scrollback: 1000,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fitAddon = new (FitAddon as any)();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      fitAddon.fit();
      termRef.current = term;

      term.writeln("\x1b[36mKubeForge kubectl terminal\x1b[0m");
      term.writeln("\x1b[90mTry: kubectl get pods  |  kubectl get nodes  |  kubectl help\x1b[0m");
      writePrompt();

      term.onData((data: string) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          const cmd = inputRef.current;
          inputRef.current = "";
          runCommand(cmd);
        } else if (code === 127) {
          if (inputRef.current.length > 0) {
            inputRef.current = inputRef.current.slice(0, -1);
            term.write("\b \b");
          }
        } else if (data === "\x1b[A") {
          const newIdx = Math.min(histIdxRef.current + 1, historyRef.current.length - 1);
          histIdxRef.current = newIdx;
          const entry = historyRef.current[newIdx] ?? "";
          term.write("\b \b".repeat(inputRef.current.length));
          inputRef.current = entry;
          term.write(entry);
        } else if (data === "\x1b[B") {
          const newIdx = Math.max(histIdxRef.current - 1, -1);
          histIdxRef.current = newIdx;
          const entry = newIdx >= 0 ? (historyRef.current[newIdx] ?? "") : "";
          term.write("\b \b".repeat(inputRef.current.length));
          inputRef.current = entry;
          term.write(entry);
        } else if (code >= 32) {
          inputRef.current += data;
          term.write(data);
        }
      });

      observer = new ResizeObserver(() => fitAddon.fit?.());
      if (containerRef.current) observer.observe(containerRef.current);
    })();

    return () => {
      disposed = true;
      observer?.disconnect();
      term?.dispose();
      termRef.current = null;
    };
  }, []); // mount once only

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{ background: "#0f1117" }}
    />
  );
}
