import type { Provider } from "@/lib/providers";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { Gallery } from "@/components/provider/gallery";
import { Team } from "@/components/provider/team";
import { MobileBookBar } from "@/components/provider/mobile-book-bar";
import { PlannerProvider } from "@/components/catering/planner";
import { CateringHero } from "@/components/catering/catering-hero";
import { CateringIntro } from "@/components/catering/catering-intro";
import { MenuCards } from "@/components/catering/menu-cards";
import { MenuShowcase } from "@/components/catering/menu-showcase";
import { EventCalculator } from "@/components/catering/event-calculator";
import { CateringAvailability } from "@/components/catering/catering-availability";
import { CateringPromo } from "@/components/catering/catering-promo";
import { ExperienceTimeline } from "@/components/catering/experience-timeline";
import { CateringTestimonials } from "@/components/catering/catering-testimonials";
import { CateringCta } from "@/components/catering/catering-cta";

/** Profile layout for catering companies: gastronomy first, built around menus and quotes. */
export function CateringProfile({ provider }: { provider: Provider & { catering: NonNullable<Provider["catering"]> } }) {
  return (
    <PlannerProvider details={provider.catering}>
      <Navbar />
      <CateringHero provider={provider} />
      <CateringIntro provider={provider} />
      <MenuCards provider={provider} />
      <MenuShowcase provider={provider} />
      <EventCalculator provider={provider} />
      <CateringAvailability provider={provider} />
      <CateringPromo provider={provider} />
      <Gallery
        provider={provider}
        title="Gastronomía que se ve tan bien como sabe"
        description="Buffets, mesas, decoración y la cocina en plena acción, en eventos reales."
      />
      <ExperienceTimeline />
      <Team
        provider={provider}
        title="Las manos detrás de cada plato"
        description="Chefs, pasteleros y parrilleros con años de oficio, y un equipo de sala que cuida cada mesa."
      />
      <CateringTestimonials provider={provider} />
      <CateringCta provider={provider} />
      <Footer />
      <MobileBookBar provider={provider} href="#calculadora" label="Cotizar" />
    </PlannerProvider>
  );
}
