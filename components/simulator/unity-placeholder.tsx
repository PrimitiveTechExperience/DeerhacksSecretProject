"use client"

import type { RobotParams } from "@/lib/types"

interface UnityPlaceholderProps {
  params: RobotParams
}

/**
 * Placeholder for the Unity WebGL simulator.
 *
 * To integrate Unity later:
 * 1. Install `react-unity-webgl`
 * 2. Replace this component's content with the Unity canvas
 * 3. Use the `params` prop to call `sendMessage()` on the Unity instance
 *
 * Expected Unity interface:
 *   sendMessage("RobotController", "UpdateParams", JSON.stringify(params))
 */
export function UnityPlaceholder({ params }: UnityPlaceholderProps) {
  return (
    <div
      id="unity-container"
      className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-card"
    >
      {/* Grid background */}
      <div className="grid-bg absolute inset-0" />

      {/* Scanline overlay */}
      <div className="scanlines absolute inset-0" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        {/* Robot arm icon, large */}
        <div className="crosshair relative flex size-24 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5">
          <svg
            viewBox="0 0 48 48"
            className="size-14 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="18" y="36" width="12" height="6" rx="1.5" className="fill-primary/10 stroke-primary/40" />
            <path d="M24 36 C24 28, 20 24, 16 18" className="stroke-primary/60" strokeWidth="3" />
            <path d="M16 18 C13 12, 14 8, 18 6" className="stroke-primary/60" strokeWidth="2.5" />
            <circle cx="18" cy="6" r="2.5" className="fill-primary/30 stroke-primary" />
            <circle cx="16" cy="18" r="2" className="fill-background stroke-primary/50" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-display text-lg font-bold text-foreground">
            Unity WebGL Simulator
          </h3>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            The 3D continuum robot visualization will render here.
            Controls are live and ready to connect.
          </p>
        </div>

        {/* Live params readout */}
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-border/50 bg-secondary/50 p-3 font-mono text-xs">
          <ParamReadout label={"\u03BA\u2081"} value={params.kappa1.toFixed(1)} />
          <ParamReadout label={"\u03BA\u2082"} value={params.kappa2.toFixed(1)} />
          <ParamReadout label="L\u2081" value={params.L1.toFixed(2)} />
          <ParamReadout
            label={"\u03C6\u2081"}
            value={`${params.phi1.toFixed(0)}\u00B0`}
          />
          <ParamReadout
            label={"\u03C6\u2082"}
            value={`${params.phi2.toFixed(0)}\u00B0`}
          />
          <ParamReadout label="L\u2082" value={params.L2.toFixed(2)} />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          <span className="font-mono text-[10px] font-medium tracking-wider text-primary uppercase">
            Awaiting Unity Build
          </span>
        </span>
      </div>
    </div>
  )
}

function ParamReadout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  )
}
