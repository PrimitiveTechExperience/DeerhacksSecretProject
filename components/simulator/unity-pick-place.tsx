"use client"

import { useRef } from "react"
import { useUnityWebGL } from "@/hooks/use-unity-webgl"
import { UNITY2_BUILD_CONFIG } from "@/lib/unity2-webgl"

export function UnityPickPlace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { status, progress, error } = useUnityWebGL(canvasRef, UNITY2_BUILD_CONFIG)

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-border/50 bg-card">
      <div className="grid-bg absolute inset-0" />
      <canvas id="unity2-canvas" ref={canvasRef} tabIndex={-1} className="absolute inset-0 z-[1] h-full w-full" />

      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-lg border border-border/50 bg-background/70 px-4 py-3 text-center backdrop-blur-sm">
            <p className="font-display text-sm font-semibold text-foreground">Pick & Place Simulator</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-primary">
              {status === "loading-script" && "Loading Unity2 loader..."}
              {status === "creating-instance" && `Initializing... ${Math.round(progress * 100)}%`}
              {status === "error" && "Unity2 build not detected"}
              {status === "idle" && "Preparing..."}
            </p>
            {error && <p className="mt-1 max-w-xs text-xs text-destructive">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
