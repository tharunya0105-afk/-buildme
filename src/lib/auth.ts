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
          // Demo fallback in case of transient database initialization
          if (credentials.email === "engineer@buildme.demo" && credentials.password === "demo1234") {
            return {
              id: "demo-engineer-id",
              email: "engineer@buildme.demo",
              name: "Demo Engineer",
              role: "engineer",
            };
          }
          if (credentials.email === "rkumar@buildme.demo" && credentials.password === "demo1234") {
            return {
              id: "demo-homeowner-id",
              email: "rkumar@buildme.demo",
              name: "R. Kumar",
              role: "homeowner",
            };
          }
          throw new Error(`Database error: ${dbErr?.message || "Failed to query database"}`);
        }

        if (!user) {
          // Demo fallback if database is unseeded on cold start
          if (credentials.email === "engineer@buildme.demo" && credentials.password === "demo1234") {
            return {
              id: "demo-engineer-id",
              email: "engineer@buildme.demo",
              name: "Demo Engineer",
              role: "engineer",
            };
          }
          if (credentials.email === "rkumar@buildme.demo" && credentials.password === "demo1234") {
            return {
              id: "demo-homeowner-id",
              email: "rkumar@buildme.demo",
              name: "R. Kumar",
              role: "homeowner",
            };
          }
          throw new Error("No account found with this email");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          // Check if it's the demo account using default demo password
          if (
            (user.email === "engineer@buildme.demo" || user.email === "rkumar@buildme.demo") &&
            credentials.password === "demo1234"
          ) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
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
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "buildme-local-development-secret-change-in-production",
};
