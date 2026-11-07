import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroCopy } from "@/components/HeroCopy";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main>
        <section id="top" aria-label="Intro">
          <HeroCopy />
          <div id="chart-slot" />
        </section>
        <Experience />
      </main>
      <Footer />
    </div>
  );
}
