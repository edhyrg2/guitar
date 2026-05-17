export type BrandRow = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  website: string | null;
  type: string | null;
  country: string | null;
  active: boolean;
};

export type BrandInput = Omit<BrandRow, "id">;
