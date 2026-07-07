import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/my-design", "/users", "/ai", "/custom-builder", "/custom-component", "/saved-setups", "/guitar/", "/master-data/", "/wiring/"],
      },
    ],
    sitemap: "https://guitarwire.app/sitemap.xml",
  };
}
