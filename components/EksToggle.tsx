"use client";

import { useAppStore } from "@/lib/store";

export function EksToggle() {
  const { eksMode, toggleEksMode } = useAppStore();

  return (
    <button
      onClick={toggleEksMode}
      data-testid="eks-toggle"
      aria-pressed={eksMode}
      className={`
        relative inline-flex h-7 w-36 items-center rounded-full border text-xs font-semibold
        transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600
        ${eksMode
          ? "border-teal-600 bg-teal-600/20 text-teal-400"
          : "border-surface-600 bg-surface-700 text-gray-400"
        }
      `}
    >
      <span
        className={`
          absolute left-1 top-1 h-5 w-16 rounded-full transition-all duration-200
          ${eksMode ? "translate-x-18 bg-teal-600" : "translate-x-0 bg-surface-600"}
        `}
      />
      <span className="relative z-10 w-full text-center">
        {eksMode ? "EKS Mode" : "Vanilla K8s"}
      </span>
    </button>
  );
}
