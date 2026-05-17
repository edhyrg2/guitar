import { getPrismaClient } from "@/lib/prisma";
import { type UserRow } from "@/lib/user-types";

type PrismaUserLevel = "USER" | "DEVELOPER" | "MASTER";

type PrismaUserRecord = {
  name: string;
  email: string;
  level: PrismaUserLevel;
  photoUrl: string | null;
  isActive: boolean;
  emailVerifiedAt: Date | null;
};

const levelLabelMap: Record<PrismaUserLevel, UserRow["level"]> = {
  USER: "User",
  DEVELOPER: "Developer",
  MASTER: "Master",
};

export const seedUserRows: UserRow[] = [
  {
    name: "Maya Chen",
    email: "maya@northstar.app",
    level: "Master",
    photo: "MC",
    verification: "Verified",
    activity: "Active",
  },
  {
    name: "Rafi Hidayat",
    email: "rafi@northstar.app",
    level: "Developer",
    photo: "RH",
    verification: "Pending",
    activity: "Active",
  },
  {
    name: "Daniel Putra",
    email: "daniel@northstar.app",
    level: "Developer",
    photo: "DP",
    verification: "Verified",
    activity: "Deactive",
  },
  {
    name: "Asha Kartika",
    email: "asha@northstar.app",
    level: "User",
    photo: "AK",
    verification: "Pending",
    activity: "Active",
  },
  {
    name: "Sinta Wulandari",
    email: "sinta@northstar.app",
    level: "User",
    photo: "SW",
    verification: "Verified",
    activity: "Active",
  },
  {
    name: "Budi Santoso",
    email: "budi@northstar.app",
    level: "Master",
    photo: "BS",
    verification: "Pending",
    activity: "Deactive",
  },
  {
    name: "Nadia Putri",
    email: "nadia@northstar.app",
    level: "Developer",
    photo: "NP",
    verification: "Verified",
    activity: "Active",
  },
  {
    name: "Farhan Malik",
    email: "farhan@northstar.app",
    level: "User",
    photo: "FM",
    verification: "Pending",
    activity: "Active",
  },
];

function getInitials(name: string, photoUrl: string | null) {
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

function mapUserRecord(user: PrismaUserRecord): UserRow {
  return {
    name: user.name,
    email: user.email,
    level: levelLabelMap[user.level],
    photo: getInitials(user.name, user.photoUrl),
    verification: user.emailVerifiedAt ? "Verified" : "Pending",
    activity: user.isActive ? "Active" : "Deactive",
  };
}

export async function getUserRows(): Promise<UserRow[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return seedUserRows;
    }

    const prismaUsers = (await prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      select: {
        name: true,
        email: true,
        level: true,
        photoUrl: true,
        isActive: true,
        emailVerifiedAt: true,
      },
    })) as PrismaUserRecord[];

    return prismaUsers.map(mapUserRecord);
  } catch {
    return seedUserRows;
  }
}
