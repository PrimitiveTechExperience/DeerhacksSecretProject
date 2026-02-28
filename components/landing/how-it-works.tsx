"use client"

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-20 flex flex-col items-center gap-3 text-center">
          <span className="font-mono text-xs font-medium tracking-widest text-primary uppercase">
            {"// workflow"}
          </span>
          <h2 className="font-display text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
        </div>

        {/* Steps as a vertical timeline on mobile, horizontal on desktop */}
        <div className="relative flex flex-col gap-16 md:flex-row md:gap-0">
          {/* Horizontal connector */}
          <div className="absolute top-10 left-[60px] hidden h-px w-[calc(100%-120px)] bg-gradient-to-r from-primary/30 via-primary/15 to-primary/30 md:block" />
          {/* Vertical connector for mobile */}
          <div className="absolute top-10 left-[30px] h-[calc(100%-80px)] w-px bg-gradient-to-b from-primary/30 via-primary/15 to-primary/30 md:hidden" />

          <Step
            number="01"
            title="Adjust"
            description="Drag 6 precision sliders to set curvature, bend direction, and length for each segment. Or load a preset."
            detail={
              <div className="mt-4 flex gap-2">
                {["\u03BA", "\u03C6", "L"].map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center rounded border border-primary/20 bg-primary/5 px-2 py-1 font-mono text-xs text-primary"
                  >
                    {p}
                  </span>
                ))}
              </div>
            }
          />
          <Step
            number="02"
            title="Understand"
            description="Hit Explain. The AI coach breaks down the kinematics, describes the motion in plain language, and offers a tip."
            detail={
              <div className="mt-4 flex flex-col gap-1.5 rounded border border-border/50 bg-secondary/50 p-3 font-mono text-xs text-muted-foreground">
                <span>{"{ title, what_changed,"}</span>
                <span>{"  how_it_moves, one_tip,"}</span>
                <span>{"  safety_note }"}</span>
              </div>
            }
          />
          <Step
            number="03"
            title="Listen"
            description="Press Narrate. Natural-sounding speech reads the explanation while you keep your focus on the simulation."
            detail={
              <div className="mt-4 flex items-center gap-2">
                {[0.3, 0.6, 1, 0.8, 0.5, 0.9, 0.4, 0.7, 1, 0.6].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-primary"
                      style={{
                        height: `${h * 24}px`,
                        opacity: 0.4 + h * 0.6,
                      }}
                    />
                  )
                )}
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                  0:12
                </span>
              </div>
            }
          />
        </div>
      </div>
    </section>
  )
}

function Step({
  number,
  title,
  description,
  detail,
}: {
  number: string
  title: string
  description: string
  detail: React.ReactNode
}) {
  return (
    <div className="relative flex flex-1 gap-6 pl-0 md:flex-col md:items-center md:gap-4 md:text-center">
      {/* Number circle */}
      <div className="relative z-10 flex size-[60px] shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-background md:size-[52px]">
        <span className="font-display text-lg font-bold text-primary">{number}</span>
      </div>

      <div className="flex flex-col gap-2 md:items-center">
        <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {detail}
      </div>
    </div>
  )
}
