export type GuitarModelReference = {
  id: string;
  name: string;
};

export type GuitarModelRow = {
  id: string;
  guitarBrandId: string;
  guitarBrandName: string;
  name: string;
  slug: string | null;
  series: string | null;
  yearStart: number | null;
  yearEnd: number | null;
  bodyType: string | null;
  defaultPickupConfig: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GuitarModelInput = {
  guitarBrandId: string;
  name: string;
  slug: string | null;
  series: string | null;
  yearStart: number | null;
  yearEnd: number | null;
  bodyType: string | null;
  defaultPickupConfig: string | null;
  description: string | null;
  isActive: boolean;
};
