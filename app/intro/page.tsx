import Link from "next/link"
import type { ReactNode } from "react"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, BrainCircuit, Compass, Target } from "lucide-react"

const KEY_TERMS = [
  {
    term: "Continuum Robot",
    definition:
      "A robot with continuously bending structure, inspired by trunks, tentacles, and catheters instead of rigid joints.",
  },
  {
    term: "Curvature (kappa)",
    definition:
      "How strongly a segment bends. Larger curvature means tighter bend radius.",
  },
  {
    term: "Bend Direction (phi)",
    definition:
      "The orientation of the bending plane around the segment axis.",
  },
  {
    term: "Arc Length (L)",
    definition:
      "The length of a segment measured along its centerline.",
  },
  {
    term: "Constant Curvature Model",
    definition:
      "A common approximation where each segment is treated like a circular arc with fixed curvature.",
  },
  {
    term: "Tip Pose",
    definition:
      "The final position and orientation of the robot end-effector.",
  },
  {
    term: "Forward Kinematics",
    definition:
      "Computing robot shape and tip pose from parameters like kappa, phi, and L.",
  },
  {
    term: "Workspace",
    definition:
      "All reachable points the robot tip can attain under constraints.",
  },
  {
    term: "Redundancy",
    definition:
      "Multiple parameter combinations may produce similar tip positions.",
  },
  {
    term: "Path Planning",
    definition:
      "Choosing a safe and feasible parameter trajectory to move around obstacles.",
  },
  {
    term: "Strain / Safety Limits",
    definition:
      "Physical bounds on bend and extension to avoid material damage or unsafe motion.",
  },
  {
    term: "Singularities",
    definition:
      "Configurations where small input changes can cause unstable, ambiguous, or ineffective motion, making control harder.",
  },
]

export default function IntroPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 blueprint-grid" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />

        <section className="mx-auto max-w-6xl px-6 pb-10 pt-14">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
                <Compass className="size-3.5" />
                Continuum Robotics Primer
              </div>
              <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Bendable robots for spaces rigid arms cannot reach.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Continuum robotics studies flexible, continuously deformable robots used in domains like minimally
                invasive medicine, industrial inspection, and confined-space manipulation. This page gives you the
                core intuition before you jump into simulation and level-based practice.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="btn-smooth gap-2 font-display font-semibold">
                  <Link href="/simulator">
                    Start Exploring
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="btn-smooth gap-2">
                  <Link href="/learn">
                    Open Learning Map
                    <BookOpen className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm">
              <h2 className="font-display text-xl font-bold">Why It Matters</h2>
              <div className="mt-5 space-y-4 text-sm text-muted-foreground">
                <div className="rounded-lg border border-border/50 bg-background/40 p-4">
                  <p className="font-semibold text-foreground">Medical navigation</p>
                  <p className="mt-1">Catheter-like robots can follow curved anatomy where rigid tools struggle.</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/40 p-4">
                  <p className="font-semibold text-foreground">Inspection and maintenance</p>
                  <p className="mt-1">Continuum forms can route through pipes, ducts, and cluttered cavities.</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/40 p-4">
                  <p className="font-semibold text-foreground">High dexterity in tight spaces</p>
                  <p className="mt-1">Body shape itself becomes a control variable, not just joint angles.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-10">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard
              icon={<BrainCircuit className="size-4" />}
              title="Core Intuition"
              text="A continuum segment behaves like a bendable arc. Change kappa for bend amount, phi for direction, and L for reach."
            />
            <InfoCard
              icon={<Target className="size-4" />}
              title="Control Objective"
              text="Reach target poses while satisfying collision and strain constraints. In practice, it is a shape-and-safety problem."
            />
            <InfoCard
              icon={<Compass className="size-4" />}
              title="Learning Path"
              text="Start with one segment, add segments, then tackle obstacle-aware and precision tasks in the roadmap."
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="rounded-2xl border border-border/60 bg-card/65 p-6 backdrop-blur-sm sm:p-8">
            <h2 className="font-display text-2xl font-bold text-foreground">Key Terms You Will See Often</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
              Keep this glossary nearby while using the simulator and roadmap. These terms appear repeatedly in
              controls, level goals, and AI coaching hints.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {KEY_TERMS.map((item) => (
                <article key={item.term} className="rounded-lg border border-border/50 bg-background/40 p-4">
                  <h3 className="font-display text-base font-semibold text-foreground">{item.term}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.definition}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm">
      <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </article>
  )
}
