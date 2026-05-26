import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

// Edge-compatible config — no Node.js-only imports (no mongoose, no fs, etc.)
// Used by middleware.ts which runs on the Edge Runtime.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.id = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: { signIn: "/" },
};
