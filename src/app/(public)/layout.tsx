import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
// import { WelcomeIntro } from "@/components/site/WelcomeIntro";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Welcome intro animation — disabled / hashed out for now */}
      {/* <WelcomeIntro /> */}
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
