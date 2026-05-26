import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/lib/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.providerAccountId && profile) {
        try {
          await connectDB();
          await User.findOneAndUpdate(
            { githubId: account.providerAccountId },
            {
              name:     profile.name,
              email:    profile.email,
              avatar:   (profile as Record<string, unknown>).avatar_url as string,
              lastSeen: new Date(),
            },
            { upsert: true }
          );
        } catch {}
      }
      return true;
    },
    jwt({ token, account }) {
      // account is only present on first sign-in; persist the GitHub user ID
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
  pages: {
    signIn: "/",
  },
});
