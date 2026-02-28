import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="relative overflow-hidden px-6 py-24">
      {/* Blueprint grid */}
      <div className="blueprint-grid absolute inset-0" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
        {/* Arc decoration */}
        <svg
          viewBox="0 0 200 40"
          className="w-32 text-primary/20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M10 35 C40 5, 80 5, 100 20 S160 35, 190 5" strokeLinecap="round" />
        </svg>

        <h2 className="font-display text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to bend some robots?
        </h2>
        <p className="max-w-md text-pretty text-muted-foreground">
          Jump into the simulator and start exploring continuum robot kinematics
          with real-time AI coaching.
        </p>

        <Button
          asChild
          size="lg"
          className="glow-lg gap-2.5 px-10 font-display text-base font-semibold"
        >
          <Link href="/simulator">
            Launch Simulator
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
