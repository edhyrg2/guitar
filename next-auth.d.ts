import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

type UserLevel = "USER" | "DEVELOPER" | "MASTER";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      level: UserLevel;
      isActive: boolean;
      photo: string | null;
    };
  }

  interface User extends DefaultUser {
    level: UserLevel;
    isActive: boolean;
    photo: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    level?: UserLevel;
    isActive?: boolean;
    photo?: string | null;
  }
}
