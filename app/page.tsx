import { PublicGalleryContent } from "@/components/public-gallery-content";
import { PublicGalleryNavbar } from "@/components/public-gallery-navbar";
import { getSafeServerSession } from "@/lib/auth-session";
import { getWiringTemplateRowsForUser } from "@/lib/wiring-template-data";

export const metadata = {
  title: "Community Wiring Gallery",
  description:
    "Discover, save, and explore guitar wiring diagrams shared by the community.",
};

export default async function HomePage() {
  const session = await getSafeServerSession();
  const templates = await getWiringTemplateRowsForUser(
    session?.user?.id ?? null
  );

  return (
    <div className="flex min-h-screen flex-col">
      <PublicGalleryNavbar />
      <main className="flex-1">
        <PublicGalleryContent templates={templates} />
      </main>
    </div>
  );
}
