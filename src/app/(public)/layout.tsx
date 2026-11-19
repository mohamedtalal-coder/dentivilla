import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSiteImages } from "@/lib/site-images";
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const siteImages = await getSiteImages();

  return (
    <div className="flex min-h-screen flex-col">
      <Header logoUrl={siteImages.logo} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer logoUrl={siteImages.logo} />
    </div>
  );
}
