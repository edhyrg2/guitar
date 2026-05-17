export type GuitarBrandRow = {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  country: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GuitarBrandInput = Omit<
  GuitarBrandRow,
  "id" | "createdAt" | "updatedAt"
>;
