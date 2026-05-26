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
  await resend.emails.send({
    from:    "KubeForge <onboarding@resend.dev>",
    to:      "kartikey.tripathi.37@gmail.com",
    subject: `New signup: ${name || "Unknown"}`,
    html: `
      <p><strong>Name:</strong> ${name || "—"}</p>
      <p><strong>Email:</strong> ${email || "—"}</p>
      <p><strong>GitHub ID:</strong> ${githubId}</p>
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
            notifyNewUser(
              profile.name ?? "",
              profile.email ?? "",
              account.providerAccountId,
            ).catch(() => {});
          }
        } catch {}
      }
      return true;
    },
  },
});
