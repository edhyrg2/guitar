import { NextResponse } from "next/server";

import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";

type ProfileUpdateBody = {
  profileBio?: string | null;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  isBuilder?: boolean;
  builderWorkshopName?: string | null;
  builderBio?: string | null;
  builderSpecialty?: string | null;
  builderExperienceYears?: number | string | null;
  builderPortfolioUrl?: string | null;
  builderShopUrl?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  xUrl?: string | null;
};

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function normalizeOptionalInt(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    return null;
  }

  return Math.max(0, Math.floor(normalized));
}

function formatProfileResponse(profile: {
  photoUrl?: string | null;
  profileBio: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  isBuilder: boolean;
  builderWorkshopName: string | null;
  builderBio: string | null;
  builderSpecialty: string | null;
  builderExperienceYears: number | null;
  builderPortfolioUrl: string | null;
  builderShopUrl: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
  updatedAt: Date;
}) {
  return {
    photo: profile.photoUrl ?? null,
    profileBio: profile.profileBio,
    location: profile.location,
    city: profile.city,
    country: profile.country,
    isBuilder: profile.isBuilder,
    builderWorkshopName: profile.builderWorkshopName,
    builderBio: profile.builderBio,
    builderSpecialty: profile.builderSpecialty,
    builderExperienceYears: profile.builderExperienceYears,
    builderPortfolioUrl: profile.builderPortfolioUrl,
    builderShopUrl: profile.builderShopUrl,
    websiteUrl: profile.websiteUrl,
    facebookUrl: profile.facebookUrl,
    instagramUrl: profile.instagramUrl,
    youtubeUrl: profile.youtubeUrl,
    xUrl: profile.xUrl,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await getSafeServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      photoUrl: true,
      profileBio: true,
      location: true,
      city: true,
      country: true,
      isBuilder: true,
      builderWorkshopName: true,
      builderBio: true,
      builderSpecialty: true,
      builderExperienceYears: true,
      builderPortfolioUrl: true,
      builderShopUrl: true,
      websiteUrl: true,
      facebookUrl: true,
      instagramUrl: true,
      youtubeUrl: true,
      xUrl: true,
      updatedAt: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(formatProfileResponse(profile));
}

export async function PATCH(request: Request) {
  const session = await getSafeServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection is not available." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as ProfileUpdateBody;

    const profile = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profileBio: normalizeOptionalText(body.profileBio, 800),
        location: normalizeOptionalText(body.location, 120),
        city: normalizeOptionalText(body.city, 120),
        country: normalizeOptionalText(body.country, 120),
        isBuilder: Boolean(body.isBuilder),
        builderWorkshopName: normalizeOptionalText(body.builderWorkshopName, 160),
        builderBio: normalizeOptionalText(body.builderBio, 1000),
        builderSpecialty: normalizeOptionalText(body.builderSpecialty, 240),
        builderExperienceYears: normalizeOptionalInt(body.builderExperienceYears),
        builderPortfolioUrl: normalizeOptionalText(body.builderPortfolioUrl, 500),
        builderShopUrl: normalizeOptionalText(body.builderShopUrl, 500),
        websiteUrl: normalizeOptionalText(body.websiteUrl, 500),
        facebookUrl: normalizeOptionalText(body.facebookUrl, 500),
        instagramUrl: normalizeOptionalText(body.instagramUrl, 500),
        youtubeUrl: normalizeOptionalText(body.youtubeUrl, 500),
        xUrl: normalizeOptionalText(body.xUrl, 500),
      },
      select: {
        photoUrl: true,
        profileBio: true,
        location: true,
        city: true,
        country: true,
        isBuilder: true,
        builderWorkshopName: true,
        builderBio: true,
        builderSpecialty: true,
        builderExperienceYears: true,
        builderPortfolioUrl: true,
        builderShopUrl: true,
        websiteUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        youtubeUrl: true,
        xUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(formatProfileResponse(profile));
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
