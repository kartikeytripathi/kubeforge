import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — KubeForge",
  description: "Terms governing use of KubeForge.",
};

const LAST_UPDATED = "May 27, 2026";

const SECTION = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-[#F5C842] text-lg font-bold mb-3">{title}</h2>
    <div className="text-[#9CA3AF] leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function TosPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E8E8E8] px-4 py-16">
      <div className="max-w-2xl mx-auto font-mono">
        <Link href="/" className="text-[#9CA3AF] text-sm hover:text-[#F5C842] transition-colors">
          ← Back to KubeForge
        </Link>

        <h1 className="text-[#F5C842] text-3xl font-bold mt-8 mb-2">Terms of Service</h1>
        <p className="text-[#9CA3AF] text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <SECTION title="1. Acceptance">
          <p>
            By signing in to KubeForge you agree to these terms. If you don&apos;t agree,
            don&apos;t use the service.
          </p>
        </SECTION>

        <SECTION title="2. What KubeForge is">
          <p>
            KubeForge is a free, educational platform for learning Kubernetes and AWS EKS
            through hands-on labs. It is provided as-is, for personal learning only.
          </p>
        </SECTION>

        <SECTION title="3. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-none space-y-2">
            {[
              "Attempt to circumvent lab verification or tamper with other users' data",
              "Scrape, crawl, or bulk-download lab content",
              "Use the platform for any commercial training product without written permission",
              "Abuse the API endpoints or attempt denial-of-service attacks",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#F5C842]">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SECTION>

        <SECTION title="4. Your account">
          <p>
            You sign in via GitHub OAuth. You are responsible for all activity under your account.
            We may suspend or delete accounts that violate these terms without notice.
          </p>
        </SECTION>

        <SECTION title="5. Your data">
          <p>
            See the{" "}
            <Link href="/privacy" className="text-[#F5C842] hover:underline">
              Privacy Policy
            </Link>{" "}
            for details on what we store and how we use it. You can delete your account
            and all associated data at any time from{" "}
            <Link href="/settings" className="text-[#F5C842] hover:underline">
              Settings
            </Link>
            .
          </p>
        </SECTION>

        <SECTION title="6. Lab content accuracy">
          <p>
            Lab content reflects best practices at the time of writing. Kubernetes and AWS
            APIs change frequently. We make no guarantee that commands or configurations
            will work unchanged in future versions. Always verify against official docs.
          </p>
        </SECTION>

        <SECTION title="7. No warranty">
          <p>
            KubeForge is provided <strong className="text-[#E8E8E8]">&quot;as is&quot;</strong> without
            warranty of any kind. We are not liable for any damages arising from use of
            the service, including but not limited to data loss, outages, or inaccurate
            lab content.
          </p>
        </SECTION>

        <SECTION title="8. Changes to these terms">
          <p>
            We may update these terms at any time. Continued use after changes constitutes
            acceptance. The &quot;Last updated&quot; date above will reflect any revisions.
          </p>
        </SECTION>

        <SECTION title="9. Contact">
          <p>
            Questions?{" "}
            <a
              href="https://github.com/kartikeytripathi/kubeforge/issues"
              className="text-[#F5C842] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open an issue on GitHub
            </a>
            .
          </p>
        </SECTION>
      </div>
    </div>
  );
}
