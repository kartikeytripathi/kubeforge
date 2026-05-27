import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — KubeForge",
  description: "How KubeForge collects, uses, and protects your data.",
};

const LAST_UPDATED = "May 27, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E8E8E8] px-4 py-16">
      <div className="max-w-2xl mx-auto font-mono">
        <Link href="/" className="text-[#9CA3AF] text-sm hover:text-[#F5C842] transition-colors">
          ← Back to KubeForge
        </Link>

        <h1 className="text-[#F5C842] text-3xl font-bold mt-8 mb-2">Privacy Policy</h1>
        <p className="text-[#9CA3AF] text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <section className="mb-10">
          <h2 className="text-[#F5C842] text-lg font-bold mb-3">1. What we collect</h2>
          <p className="text-[#9CA3AF] leading-relaxed mb-3">
            When you sign in with GitHub, we receive and store:
          </p>
          <ul className="list-none space-y-2 text-[#9CA3AF]">
            {[
              "GitHub display name and username",
              "Public email address (if set on GitHub)",
              "GitHub user ID",
              "Profile avatar URL",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#F5C842]">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#9CA3AF] leading-relaxed mt-3">
            We also store your lab activity: which labs you attempted, which you completed,
            the YAML you submitted, and timestamps.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[#F5C842] text-lg font-bold mb-3">2. How we use it</h2>
          <ul className="list-none space-y-2 text-[#9CA3AF]">
            {[
              "To identify your account and persist your progress across devices",
              "To display your name and avatar in the UI",
              "To compute your streak, heatmap, and CKA readiness score",
              "To send you a one-time welcome email when you first sign up",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#F5C842]">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#9CA3AF] leading-relaxed mt-3">
            We do not sell, rent, or share your data with any third party.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[#F5C842] text-lg font-bold mb-3">3. Where data is stored</h2>
          <p className="text-[#9CA3AF] leading-relaxed">
            All data is stored in MongoDB Atlas (AWS us-east-1 region). Sessions are
            JWT-based and stored in an HTTP-only cookie. Lab progress is also cached in
            your browser&apos;s localStorage for offline-first performance.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[#F5C842] text-lg font-bold mb-3">4. Third-party services</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#9CA3AF] border-collapse">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  <th className="text-left py-2 pr-4 text-[#E8E8E8]">Service</th>
                  <th className="text-left py-2 pr-4 text-[#E8E8E8]">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["GitHub OAuth", "Sign-in only — we never post on your behalf"],
                  ["MongoDB Atlas", "Progress and user data storage"],
                  ["Vercel", "Hosting and serverless compute"],
                  ["Resend", "Transactional email (welcome + admin notification)"],
                  ["Vercel Analytics", "Anonymous page-view analytics — no personal data"],
                ].map(([svc, purpose]) => (
                  <tr key={svc} className="border-b border-[#1a1a1a]">
                    <td className="py-2 pr-4 text-[#F5C842]">{svc}</td>
                    <td className="py-2">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-[#F5C842] text-lg font-bold mb-3">5. Data retention and deletion</h2>
          <p className="text-[#9CA3AF] leading-relaxed">
            Your data is retained for as long as your account is active. To delete your
            account and all associated data, open a{" "}
            <a
              href="https://github.com/kartikeytripathi/kubeforge/issues/new?title=Delete+my+account&body=GitHub+username:"
              className="text-[#F5C842] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub issue
            </a>{" "}
            with your GitHub username. We&apos;ll process it within 7 days.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[#F5C842] text-lg font-bold mb-3">6. Cookies</h2>
          <p className="text-[#9CA3AF] leading-relaxed">
            We use a single HTTP-only session cookie set by NextAuth for authentication.
            No advertising or tracking cookies.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[#F5C842] text-lg font-bold mb-3">7. Contact</h2>
          <p className="text-[#9CA3AF] leading-relaxed">
            Questions about this policy?{" "}
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
        </section>
      </div>
    </div>
  );
}
