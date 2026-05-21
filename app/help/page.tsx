import { PublicGalleryNavbar } from "@/components/public-gallery-navbar";
import { HelpContent } from "@/components/help-content";

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicGalleryNavbar />
      <main className="flex-1">
        <HelpContent hideNavbar />
      </main>
    </div>
  );
}
