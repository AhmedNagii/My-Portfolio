import { ChartArt } from "@/components/chart/ChartArt";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroCopy } from "@/components/HeroCopy";
import { COMPACT, DESKTOP } from "@/game/config";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main>
        <section id="top" aria-label="Intro">
          <HeroCopy />
          <div className="sm:-mt-10">
            <div className="sm:hidden">
              <ChartArt config={COMPACT} compact animate />
            </div>
            <div className="hidden sm:block">
              <ChartArt config={DESKTOP} compact={false} animate />
            </div>
          </div>
        </section>
        <Experience />
      </main>
      <Footer />
    </div>
  );
}
