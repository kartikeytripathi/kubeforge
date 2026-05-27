import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/lib/models/User";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function notifyNewUser(name: string, email: string, githubId: string) {
  if (!resend) return;
  const to = process.env.ADMIN_EMAIL;
  if (!to) return;
  await resend.emails.send({
    from:    `KubeForge <noreply@${process.env.RESEND_DOMAIN ?? "kubeforge.kartikeytripathi.in"}>`,
    to,
    subject: `New signup: ${name}`,
    html: `
      <p><strong>Name:</strong> ${name || "—"}</p>
      <p><strong>Email:</strong> ${email || "—"}</p>
      <p><strong>GitHub:</strong> <a href="https://github.com/${name}">github.com/${name}</a></p>
      <p><strong>GitHub ID:</strong> ${githubId}</p>
    `,
  });
}

async function welcomeNewUser(name: string, email: string) {
  if (!resend || !email) return;
  await resend.emails.send({
    from:    `KubeForge <noreply@${process.env.RESEND_DOMAIN ?? "kubeforge.kartikeytripathi.in"}>`,
    to:      email,
    subject: "Welcome to KubeForge 🚀",
    html: `
      <div style="font-family:monospace;background:#0A0A0A;color:#E8E8E8;padding:32px;max-width:560px;border-radius:8px;">
        <h1 style="color:#F5C842;margin:0 0 16px">Welcome to KubeForge, ${name || "there"}!</h1>
        <p style="color:#E8E8E8;margin:0 0 12px">You now have access to <strong>38 hands-on Kubernetes &amp; EKS labs</strong> — free, forever.</p>
        <p style="color:#9CA3AF;margin:0 0 24px">Each lab gives you a real kubectl environment with automated pass/fail verification. No VMs to spin up, no cloud bills.</p>
        <a href="https://kubeforge.kartikeytripathi.in/curriculum"
           style="display:inline-block;background:#F5C842;color:#0A0A0A;padding:12px 24px;border-radius:6px;font-weight:bold;text-decoration:none;">
          Start Lab A1 →
        </a>
        <p style="color:#9CA3AF;margin:24px 0 0;font-size:12px;">
          Questions or feedback? Open an issue on <a href="https://github.com/kartikeytripathi/kubeforge" style="color:#F5C842;">GitHub</a>.
        </p>
      </div>
    `,
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.providerAccountId && profile) {
        try {
          await connectDB();
          const result = await User.findOneAndUpdate(
            { githubId: account.providerAccountId },
            {
              name:     profile.name,
              email:    profile.email,
              avatar:   (profile as Record<string, unknown>).avatar_url as string,
              lastSeen: new Date(),
            },
            { upsert: true, new: false }
          );
          // result is null when the document was just created (upsert insert)
          if (!result) {
            const gh = profile as Record<string, unknown>;
            const displayName = (profile.name || gh.login || "") as string;
            const userEmail   = (profile.email || "") as string;
            notifyNewUser(displayName, userEmail, account.providerAccountId).catch(() => {});
            welcomeNewUser(displayName, userEmail).catch(() => {});
          }
        } catch {}
      }
      return true;
    },
  },
});
