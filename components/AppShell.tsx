"use client";

import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-surface-900 text-white">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
