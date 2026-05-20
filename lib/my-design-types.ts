export type MyDesignProfile = {
  id: string;
  name: string;
  email: string;
  level: "USER" | "DEVELOPER" | "MASTER";
  photo: string | null;
  photoUrl?: string | null;
  profileBio: string | null;
  location: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MyDesignItemStatus =
  | "Draft"
  | "Published"
  | "Component Draft"
  | "Published Component"
  | "Unpublished Component";

export type MyDesignItem = {
  id: string;
  type: "saved-setup" | "component-draft";
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: MyDesignItemStatus;
  editorHref: string;
  targetId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedTemplateId: string | null;
  publishedTemplateName: string | null;
  canUnpublish?: boolean;
};

export type MyDesignStats = {
  totalDesigns: number;
  savedSetups: number;
  publishedSetups: number;
  componentDrafts: number;
};
