import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// On Vercel, dynamically set NEXTAUTH_URL from VERCEL_URL so CSRF and callbacks succeed
if (process.env.VERCEL) {
  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
    if (process.env.VERCEL_URL) {
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
    } else {
      delete process.env.NEXTAUTH_URL;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {

        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        let user: any = null;
        try {
          user = await db.user.findUnique({
            where: { email: credentials.email },
          });
        } catch (dbErr: any) {
          console.error("[auth] Database query error:", dbErr);
          throw new Error(`Database error: ${dbErr?.message || "Failed to query database"}`);
        }

        if (!user) {
          throw new Error("No account found with this email. Please verify your credentials.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: (() => {
    if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
      throw new Error("FATAL: NEXTAUTH_SECRET environment variable must be set in production");
    }
    return process.env.NEXTAUTH_SECRET || "buildme-local-development-secret-change-in-production";
  })(),
};
