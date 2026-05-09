"use client";

import Link from "next/link";
import { EksToggle } from "./EksToggle";
import { KubeForgeIcon } from "./KubeForgeIcon";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-surface-600 bg-surface-900/90 px-4 backdrop-blur">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <KubeForgeIcon className="h-7 w-7 text-teal-600" />
        <span className="text-lg font-bold tracking-tight text-white">KubeForge</span>
      </Link>

      <div className="flex items-center gap-4">
        <EksToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}

function ThemeToggle() {
  // TODO(phase-6): implement light mode toggle
  return (
    <button
      aria-label="Toggle theme"
      className="rounded-md p-1.5 text-gray-400 hover:bg-surface-700 hover:text-white transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  );
}
