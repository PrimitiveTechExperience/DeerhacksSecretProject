"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const RobotArmSVG = dynamic(
  () => import("./robot-arm-svg").then((mod) => mod.RobotArmSVG),
  { ssr: false }
)

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-20 sm:py-28 lg:py-36">
      {/* Blueprint grid background */}
      <div className="blueprint-grid absolute inset-0" />

      {/* Radial gradient washes */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_40%,oklch(0.7_0.17_55_/_0.06)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_80%_60%,oklch(0.7_0.17_55_/_0.04)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col-reverse items-center gap-12 lg:flex-row lg:gap-16">
        {/* Left: Text content */}
        <div className="flex flex-1 flex-col items-center gap-8 text-center lg:items-start lg:text-left">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <span className="size-1.5 rounded-full bg-primary arm-pulse" />
            <span className="font-mono text-xs font-medium tracking-wider text-primary uppercase">
              Interactive Robot Tutor
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-balance text-5xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Learn to bend
            <br />
            <span className="relative inline-block text-primary">
              continuum robots
              <svg
                className="absolute -bottom-2 left-0 w-full text-primary/30"
                viewBox="0 0 300 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8 C50 2, 100 10, 150 4 S250 10, 298 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
            Adjust curvature, bend direction, and segment length on a real-time
            3D simulator. An AI coach explains every movement and reads
            it back to you.
          </p>

          {/* CTA row */}
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="glow-lg gap-2.5 px-8 font-display text-base font-semibold"
            >
              <Link href="/simulator">
                Open Simulator
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2 px-8 font-display text-base font-medium"
            >
              <Link href="/learn">Open Learning Map</Link>
            </Button>
          </div>

          {/* Metrics strip */}
          <div className="flex items-center gap-8 pt-4">
            <Metric label="Segments" value="2" />
            <div className="h-6 w-px bg-border" />
            <Metric label="Parameters" value="6" />
            <div className="h-6 w-px bg-border" />
            <Metric label="AI Models" value="2" />
          </div>
        </div>

        {/* Right: Animated robot */}
        <div className="relative flex flex-1 items-center justify-center">
          {/* Concentric rings behind robot */}
          <div className="absolute size-[320px] rounded-full border border-primary/5 sm:size-[400px]" />
          <div className="absolute size-[240px] rounded-full border border-primary/8 sm:size-[300px]" />
          <div className="absolute size-[160px] rounded-full border border-primary/10 sm:size-[200px]" />
          <RobotArmSVG />
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 lg:items-start">
      <span className="font-display text-2xl font-bold text-foreground">{value}</span>
      <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )
}
