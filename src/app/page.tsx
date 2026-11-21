import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroCopy } from "@/components/HeroCopy";
import { PortraitSwap } from "@/components/hero/PortraitSwap";
import { SeasonSky } from "@/components/season/SeasonSky";

export default function Home() {
  return (
    // Content stops growing at 1280px on big screens; the weather still spans the full width.
    <div className="min-h-screen overflow-x-clip">
      <div className="mx-auto w-full max-w-7xl">
        <Header />
        <main>
          <section id="top" aria-label="Intro" className="relative isolate">
            {/* Reaches up behind the (transparent) header so the weather starts at the top of the page. */}
            <div className="absolute -top-28 bottom-0 left-1/2 -z-10 w-screen -translate-x-1/2 [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
              <SeasonSky />
            </div>
            <div className="grid items-center gap-8 pb-10 sm:grid-cols-[1fr_minmax(0,40%)] sm:pb-16 lg:grid-cols-[1fr_420px] lg:pr-10">
              <HeroCopy />
              <div className="mx-auto w-full max-w-[340px] px-4 sm:max-w-none sm:px-0 sm:pr-10 lg:pr-0">
                <PortraitSwap />
              </div>
            </div>
          </section>
          <Experience />
        </main>
        <Footer />
      </div>
    </div>
  );
}
