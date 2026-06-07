import type { NextAuthOptions } from "next-auth";
import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";

import { getPrismaClient } from "@/lib/prisma";

type PrismaUserLevel = "USER" | "DEVELOPER" | "MASTER";
const authSecret = process.env.NEXTAUTH_SECRET;

function getUserPhoto(name: string, photoUrl: string | null) {
  if (photoUrl) {
    return photoUrl;
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email dan Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "maya@northstar.app",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const prisma = await getPrismaClient();

        if (!prisma) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            level: true,
            photoUrl: true,
            isActive: true,
            emailVerifiedAt: true,
          },
        });

        if (!user?.isActive || !user.emailVerifiedAt) {
          return null;
        }

        const isValidPassword = await compare(password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          level: user.level,
          isActive: user.isActive,
          photo: getUserPhoto(user.name, user.photoUrl),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.level = user.level as PrismaUserLevel;
        token.isActive = user.isActive as boolean;
        token.photo = user.photo as string;
      }

      if (trigger === "update" && typeof session?.user?.photo === "string") {
        token.photo = session.user.photo;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.level = token.level as PrismaUserLevel;
        session.user.isActive = Boolean(token.isActive);
        session.user.photo = (token.photo as string | undefined) ?? null;
      }

      return session;
    },
  },
};
