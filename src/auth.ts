import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

class AccountPendingError extends CredentialsSignin {
  code = "account_pending";
}

class AccountSuspendedError extends CredentialsSignin {
  code = "account_suspended";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, credentials.username as string))
          .limit(1);

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        if (user.status === "pending") throw new AccountPendingError();
        if (user.status === "suspended") throw new AccountSuspendedError();

        return {
          id: user.id,
          name: user.name ?? user.username,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl ?? undefined,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
        token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { avatarUrl?: string | null }).avatarUrl = token.avatarUrl as string | null;
      }
      return session;
    },
  },
});
