import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSiteImages } from "@/lib/site-images";
import { getSiteCopy } from "@/lib/site-settings";
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [siteImages, copy] = await Promise.all([getSiteImages(), getSiteCopy()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        logoUrl={siteImages.logo}
        doctorName={copy.doctorName}
        doctorTitle={copy.doctorTitle}
        doctorSubtitle={copy.doctorSubtitle}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer logoUrl={siteImages.logo} />
    </div>
  );
}
