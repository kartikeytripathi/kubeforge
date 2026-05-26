import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "KubeForge — Hands-on Kubernetes & EKS Learning",
  description:
    "Learn Kubernetes and EKS by doing. Every concept has a lab. Every lab has automated verification.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className="dark">
      <body>
        <Providers session={session}>
          {session ? <AppShell>{children}</AppShell> : children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
