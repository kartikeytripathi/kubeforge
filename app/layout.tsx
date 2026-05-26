import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import { auth } from "@/auth";

const BASE_URL = "https://kubeforge.kartikeytripathi.in";

export const metadata: Metadata = {
  title: "KubeForge — Hands-on Kubernetes & EKS Learning",
  description:
    "Learn Kubernetes and EKS by doing. 38 labs across 4 phases — real kubectl commands, in-browser cluster, automated verification. Free forever.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "KubeForge",
    title: "KubeForge — Hands-on Kubernetes & EKS Learning",
    description:
      "Learn Kubernetes and EKS by doing. 38 labs across 4 phases — real kubectl commands, in-browser cluster, automated verification. Free forever.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "KubeForge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KubeForge — Hands-on Kubernetes & EKS Learning",
    description:
      "Learn Kubernetes and EKS by doing. 38 labs, real kubectl, automated verification. Free forever.",
    images: ["/og-image.png"],
  },
  keywords: ["Kubernetes","EKS","CKA","kubectl","Kubernetes labs","hands-on Kubernetes","AWS EKS tutorial","Karpenter","IRSA","DevOps"],
  alternates: { canonical: BASE_URL },
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
