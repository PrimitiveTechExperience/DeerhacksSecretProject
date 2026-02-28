"use client"

import { useEffect, useRef } from "react"
import type { RobotParams } from "@/lib/types"
import type { Obstacle } from "@/lib/levels"
import type { Point3 } from "@/lib/kinematics"
import { useUnityWebGL } from "@/hooks/use-unity-webgl"
import { UNITY_BUILD_CONFIG } from "@/lib/unity-webgl"

interface UnityPlaceholderProps {
  params: RobotParams
  target?: Point3
  obstacles?: Obstacle[]
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
export function UnityPlaceholder({ params, target, obstacles }: UnityPlaceholderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { status, progress, error, isReady, sendMessage } = useUnityWebGL(canvasRef, UNITY_BUILD_CONFIG)

  useEffect(() => {
    if (!isReady) return
    sendMessage("RobotController", "UpdateParams", JSON.stringify(params))
  }, [isReady, params, sendMessage])

  useEffect(() => {
    if (!isReady) return
    if (!target && !obstacles?.length) return
    const levelContext = JSON.stringify({ target, obstacles })
    sendMessage("RobotController", "UpdateLevelContext", levelContext)
  }, [isReady, target, obstacles, sendMessage])

  return (
    <div
      id="unity-container"
      className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-card"
    >
      {/* Grid background */}
      <div className="grid-bg absolute inset-0" />

      {/* Scanline overlay */}
      <div className="scanlines absolute inset-0" />

      <canvas ref={canvasRef} className="absolute inset-0 z-[1] h-full w-full" />

      {/* Overlay content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center pointer-events-none">
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
            {status === "ready" ? "Unity Simulator Connected" : "Unity WebGL Simulator"}
          </h3>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {status === "ready"
              ? "Live robot view is running. Parameter updates are streaming to Unity."
              : "The 3D continuum robot visualization will render here. Controls are live and ready to connect."}
          </p>
          {status !== "ready" && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
              {status === "loading-script" && "Loading Unity loader..."}
              {status === "creating-instance" && `Initializing scene... ${Math.round(progress * 100)}%`}
              {status === "error" && "Unity build not detected"}
              {status === "idle" && "Preparing..."}
            </p>
          )}
          {error && (
            <p className="max-w-sm text-xs text-destructive">{error}</p>
          )}
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
          <span className={`size-1.5 rounded-full ${status === "ready" ? "bg-green-500" : "animate-pulse bg-primary"}`} />
          <span className="font-mono text-[10px] font-medium tracking-wider text-primary uppercase">
            {status === "ready" ? "Unity Ready" : "Awaiting Unity Build"}
          </span>
        </span>

        {(target || obstacles?.length) && (
          <div className="flex flex-wrap justify-center gap-2 text-[10px]">
            {target && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-primary">
                TARGET: ({target.x.toFixed(2)}, {target.y.toFixed(2)}, {target.z.toFixed(2)})
              </span>
            )}
            {obstacles?.map((obstacle, idx) => (
              <span
                key={`${obstacle.x}-${obstacle.y}-${obstacle.z}-${idx}`}
                className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1 font-mono text-destructive"
              >
                OBS {idx + 1}: r={obstacle.radius.toFixed(2)}
              </span>
            ))}
          </div>
        )}
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
