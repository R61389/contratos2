import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProvider, getPublicProviders } from "@/lib/data/public-providers";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ProviderHero } from "@/components/provider/provider-hero";
import { ProviderInfo } from "@/components/provider/provider-info";
import { Booking } from "@/components/provider/booking";
import { Promo } from "@/components/provider/promo";
import { Gallery } from "@/components/provider/gallery";
import { Videos } from "@/components/provider/videos";
import { Team } from "@/components/provider/team";
import { Reviews } from "@/components/provider/reviews";
import { Packages } from "@/components/provider/packages";
import { ProviderCta } from "@/components/provider/provider-cta";
import { MobileBookBar } from "@/components/provider/mobile-book-bar";
import { ProviderMusic } from "@/components/provider/music-player";
import { CateringProfile } from "@/components/catering/catering-profile";

type Params = Promise<{ slug: string }>;

// Pages are rebuilt at most once a minute, so panel changes reach the public profile shortly after saving.
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getPublicProviders()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getPublicProvider(slug);
  if (!provider) return {};
  return {
    title: `${provider.fullName} — VIBRA`,
    description: provider.tagline,
    openGraph: {
      title: `${provider.fullName} en VIBRA`,
      description: provider.tagline,
      images: [provider.heroImage],
    },
  };
}

export default async function ProviderPage({ params }: { params: Params }) {
  const { slug } = await params;
  const provider = await getPublicProvider(slug);
  if (!provider) notFound();

  if (provider.catering) {
    return (
      <main className="relative overflow-x-clip">
        <CateringProfile provider={{ ...provider, catering: provider.catering }} />
      </main>
    );
  }

  return (
    <main className="relative overflow-x-clip">
      <ProviderMusic provider={provider}>
        <Navbar />
        <ProviderHero provider={provider} />
        <ProviderInfo provider={provider} />
        <Booking provider={provider} />
        {provider.promo.discount > 0 && <Promo provider={provider} />}
        {provider.gallery.length > 0 && <Gallery provider={provider} />}
        {provider.videos.length > 0 && <Videos provider={provider} />}
        {provider.team.length > 0 && <Team provider={provider} />}
        {provider.reviews.length > 0 && <Reviews provider={provider} />}
        {provider.packages.length > 0 && <Packages provider={provider} />}
        <ProviderCta provider={provider} />
        <Footer />
        <MobileBookBar provider={provider} />
      </ProviderMusic>
    </main>
  );
}
