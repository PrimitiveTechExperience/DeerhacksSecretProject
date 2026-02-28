import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
