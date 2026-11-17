import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Readex_Pro } from "next/font/google";
import "./globals.css";

const readex = Readex_Pro({
  variable: "--font-readex",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dentivilla | د. محمد ياسر الجبالي — تجميل وجراحة الأسنان",
    template: "%s | Dentivilla",
  },
  description:
    "عيادة Dentivilla — د. محمد ياسر الجبالي، تجميل وزراعة الأسنان بالقاهرة، مع حجز إلكتروني ونموذج فك ثلاثي الأبعاد لتحديد السن.",
  openGraph: { locale: "ar_EG", type: "website", siteName: "Dentivilla" },
};

export const viewport: Viewport = { themeColor: "#0c4f4d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${readex.variable} ${jakarta.variable} antialiased`}>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:rounded-full focus:bg-teal-deep focus:px-4 focus:py-2 focus:text-white"
        >
          تخطَّ إلى المحتوى
        </a>
        {children}
      </body>
    </html>
  );
}
