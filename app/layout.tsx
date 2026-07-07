import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { cn } from "@/lib/utils";
import { ThemeSync } from "@/components/theme-sync";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://guitarwire.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Guitar Wire — Guitar Wiring Diagram Studio",
    template: "%s · Guitar Wire",
  },
  description:
    "Build, browse, and share guitar wiring diagrams. Reference pickup combinations, components, and templates for your next build.",
  applicationName: "Guitar Wire",
  keywords: [
    "guitar wiring",
    "wiring diagram",
    "pickup",
    "potentiometer",
    "capacitor",
    "switch",
    "guitar electronics",
    "diagram studio",
  ],
  authors: [{ name: "Guitar Wire" }],
  creator: "Guitar Wire",
  publisher: "Guitar Wire",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Guitar Wire",
    title: "Guitar Wire — Guitar Wiring Diagram Studio",
    description:
      "Build, browse, and share guitar wiring diagrams. Reference pickup combinations, components, and templates for your next build.",
    images: [
      {
        url: "/icon",
        width: 512,
        height: 512,
        alt: "Guitar Wire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guitar Wire — Guitar Wiring Diagram Studio",
    description:
      "Build, browse, and share guitar wiring diagrams. Reference pickup combinations, components, and templates for your next build.",
    images: ["/icon"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <ThemeSync />
          <TooltipProvider>{children}</TooltipProvider>
        </AppProviders>
      </body>
    </html>
  );
}
