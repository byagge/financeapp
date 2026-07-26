import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // authorize is overridden in auth.ts (Node runtime with SQLite)
      authorize: async () => null,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/ru/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.locale = user.locale ?? "ru";
        token.role = user.role ?? "user";
        if (user.name) token.name = user.name;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.locale) token.locale = session.locale;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.locale = (token.locale as string) ?? "ru";
        session.user.role = (token.role as string) ?? "user";
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
