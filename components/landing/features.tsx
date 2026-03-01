"use client";

import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    // Custom SVG icon for each
    icon: (
      <svg
        viewBox="0 0 40 40"
        className="size-10"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="28"
          width="32"
          height="6"
          rx="2"
          className="fill-primary/10 stroke-primary"
          strokeWidth="1"
        />
        <path
          d="M20 28 C20 22, 16 18, 12 12"
          className="stroke-primary"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M12 12 C10 8, 12 5, 16 4"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="4" r="2" className="fill-primary" />
        <circle
          cx="12"
          cy="12"
          r="1.5"
          className="fill-background stroke-primary"
          strokeWidth="1"
        />
      </svg>
    ),
    title: "Real-Time Simulation",
    description:
      "Manipulate a 2-segment continuum robot through 6 kinematic parameters. Watch curvature, bend direction, and length respond instantly in 3D space.",
    tag: "SIM",
  },
  {
    icon: (
      <svg
        viewBox="0 0 40 40"
        className="size-10"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r="14"
          className="stroke-primary/20"
          strokeWidth="1"
        />
        <circle
          cx="20"
          cy="20"
          r="8"
          className="stroke-primary/30"
          strokeWidth="1"
        />
        <circle cx="20" cy="20" r="3" className="fill-primary" />
        <path
          d="M20 6 L20 10"
          className="stroke-primary"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M20 30 L20 34"
          className="stroke-primary"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M6 20 L10 20"
          className="stroke-primary"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M30 20 L34 20"
          className="stroke-primary"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 12 L14.5 14.5"
          className="stroke-primary/60"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M25.5 25.5 L28 28"
          className="stroke-primary/60"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: "AI Kinematic Coach",
    description:
      "Gemini analyzes your exact configuration and explains the physics behind every bend. Get structured breakdowns of what changed, how it moves, and what to try next.",
    tag: "AI",
  },
  {
    icon: (
      <svg
        viewBox="0 0 40 40"
        className="size-10"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="10"
          y="8"
          width="20"
          height="24"
          rx="4"
          className="stroke-primary/30"
          strokeWidth="1"
        />
        <rect
          x="14"
          y="12"
          width="12"
          height="3"
          rx="1"
          className="fill-primary/20"
        />
        <path d="M14 20 L26 20" className="stroke-primary/40" strokeWidth="1" />
        <path d="M14 24 L22 24" className="stroke-primary/40" strokeWidth="1" />
        {/* Sound wave arcs */}
        <path
          d="M30 16 C33 18, 33 22, 30 24"
          className="stroke-primary"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M33 13 C38 17, 38 23, 33 27"
          className="stroke-primary/50"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: "Voice Narration",
    description:
      "ElevenLabs reads your coaching feedback aloud with natural speech.",
    tag: "TTS",
  },
];

export function Features() {
  return (
    <section id="features" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 flex flex-col items-center gap-3 text-center">
          <span className="font-mono text-xs font-medium tracking-widest text-primary uppercase">
            {"// capabilities"}
          </span>
          <h2 className="font-display text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Three systems, one loop
          </h2>
          <p className="max-w-md text-pretty text-muted-foreground">
            Simulate. Understand. Listen. Each system feeds the next.
          </p>
        </div>

        {/* Feature cards with connecting line */}
        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connector line behind cards */}
          <div className="absolute top-1/2 left-[16.67%] hidden h-px w-[66.67%] -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent md:block" />

          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/50 bg-card/90 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg dark:bg-card/70"
            >
              {/* Corner tag */}
              <div className="absolute right-4 top-4 font-mono text-[10px] font-bold tracking-widest text-primary/40">
                {feature.tag}
              </div>

              <CardContent className="flex flex-col gap-5 pt-8 pb-8">
                {/* Icon with crosshair bg */}
                <div className="crosshair relative flex size-16 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 transition-colors group-hover:border-primary/20 group-hover:bg-primary/8">
                  {feature.icon}
                </div>

                <h3 className="font-display text-lg font-bold text-foreground">
                  {feature.title}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>

                {/* Bottom dimension line decoration */}
                <div className="mt-auto h-px w-full bg-gradient-to-r from-primary/15 to-transparent" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
