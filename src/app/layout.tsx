import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Readex_Pro } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { getSiteImages } from "@/lib/site-images";
import { getSiteMetadata } from "@/lib/site-settings";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const readex = Readex_Pro({
  variable: "--font-readex",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

const DEFAULT_TITLE = "Dentivilla | Dr. Mohamed Yasser El Gebaly — Aesthetic & Restorative Dentistry";
const DEFAULT_DESCRIPTION =
  "Dentivilla Dental Clinic — Dr. Mohamed Yasser El Gebaly. General, aesthetic, and restorative dentistry in Cairo. Online appointment booking and interactive 3D dental model.";

export async function generateMetadata(): Promise<Metadata> {
  const [{ title, description }, { logo }] = await Promise.all([getSiteMetadata(), getSiteImages()]);
  const resolvedTitle = title || DEFAULT_TITLE;
  const resolvedDescription = description || DEFAULT_DESCRIPTION;

  return {
    metadataBase: new URL(siteUrl),
    applicationName: site.name,
    title: {
      default: resolvedTitle,
      template: `%s | ${site.name}`,
    },
    description: resolvedDescription,
    keywords: [
      "Dentivilla",
      "dentist Cairo",
      "dental clinic Nasr City",
      "aesthetic dentistry",
      "restorative dentistry",
      site.doctor.name,
    ],
    authors: [{ name: site.doctor.name }],
    creator: site.doctor.name,
    publisher: site.name,
    icons: {
      icon: [{ url: logo, type: "image/png" }],
      apple: [{ url: logo }],
      shortcut: logo,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: "/",
      locale: "en_US",
      type: "website",
      siteName: site.name,
      images: [{ url: logo, alt: site.name }],
    },
    twitter: {
      card: "summary",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [logo],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: "#0c4f4d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${jakarta.variable} ${readex.variable} antialiased`}>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-teal-deep focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
