import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { ProblemSolution } from "@/components/sections/problem-solution";
import { Services } from "@/components/sections/services";
import { ProvidersCarousel } from "@/components/sections/providers-carousel";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Packages } from "@/components/sections/packages";
import { Testimonials } from "@/components/sections/testimonials";
import { CtaFinal } from "@/components/sections/cta-final";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <main className="relative overflow-x-hidden">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <Services />
      <ProvidersCarousel />
      <HowItWorks />
      <Packages />
      <Testimonials />
      <CtaFinal />
      <Footer />
    </main>
  );
}
