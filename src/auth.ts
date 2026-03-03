import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const validUser = process.env.APP_USERNAME;
        const validPass = process.env.APP_PASSWORD;

        if (!validUser || !validPass) {
          console.error("AUTH: APP_USERNAME ou APP_PASSWORD não configurado.");
          return null;
        }

        if (
          credentials.username !== validUser ||
          credentials.password !== validPass
        ) {
          return null;
        }

        return {
          id: "1",
          name: validUser,
          email: `${validUser}@elytraai.com.br`,
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
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
