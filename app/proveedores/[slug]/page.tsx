import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROVIDERS, getProvider } from "@/lib/providers";
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

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return PROVIDERS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const provider = getProvider(slug);
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
  const provider = getProvider(slug);
  if (!provider) notFound();

  return (
    <main className="relative overflow-x-clip">
      <Navbar />
      <ProviderHero provider={provider} />
      <ProviderInfo provider={provider} />
      <Booking provider={provider} />
      <Promo provider={provider} />
      <Gallery provider={provider} />
      <Videos provider={provider} />
      <Team provider={provider} />
      <Reviews provider={provider} />
      <Packages provider={provider} />
      <ProviderCta provider={provider} />
      <Footer />
      <MobileBookBar provider={provider} />
    </main>
  );
}
