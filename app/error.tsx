"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 text-center">
      <div className="font-mono text-[#F5C842] text-8xl font-bold mb-4">500</div>
      <h1 className="text-[#E8E8E8] text-2xl font-mono mb-2">Something went wrong</h1>
      <p className="text-[#9CA3AF] font-mono mb-8 max-w-md">
        An unexpected error occurred. Try refreshing — if it persists, report it via the sidebar.
      </p>
      <button
        onClick={reset}
        className="font-mono text-sm bg-[#F5C842] text-[#0A0A0A] px-6 py-3 rounded-lg font-bold hover:bg-amber-400 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
