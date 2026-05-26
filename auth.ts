import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/lib/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
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
  },
});
