"use client"

import { useEffect, useRef } from "react"
import type { RobotParams } from "@/lib/types"
import { useUnityWebGL } from "@/hooks/use-unity-webgl"
import type { UnityBuildConfig } from "@/lib/unity-webgl"

interface UnityPickPlacePlaceholderProps {
  params: RobotParams
  grip01: number
  segmentColors: { s1: string; s2: string }
  buildConfig: UnityBuildConfig
  sceneLabel?: string
}

export function UnityPickPlacePlaceholder({
  params,
  grip01,
  segmentColors,
  buildConfig,
  sceneLabel = "unity2",
}: UnityPickPlacePlaceholderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { status, progress, error, isReady, sendMessage } = useUnityWebGL(canvasRef, buildConfig)

  const sendToObjects = (objects: string[], methodName: string, value?: string | number | boolean) => {
    if (!isReady) return false
    let sent = false
    for (const objectName of objects) {
      sent = sendMessage(objectName, methodName, value) || sent
    }
    return sent
  }

  const robotBridgeObjects = ["robot", "RobotController", "ContinuumSegmentController"]
  const clawBridgeObjects = [
    "claw3.5",
    "claw3_5",
    "claw",
    "Claw",
    "ClawController",
    "ClawSnapGrab",
    "SnapGrabber",
    "robot",
    "RobotController",
  ]

  useEffect(() => {
    if (!isReady) return
    const payload = JSON.stringify({
      nSegments: 2,
      segments: [
        { kappa: params.kappa1, phiDeg: params.phi1, length: params.L1, color: segmentColors.s1 },
        { kappa: params.kappa2, phiDeg: params.phi2, length: params.L2, color: segmentColors.s2 },
      ],
      kappa1: params.kappa1,
      phi1: params.phi1,
      L1: params.L1,
      kappa2: params.kappa2,
      phi2: params.phi2,
      L2: params.L2,
    })
    const ok = sendToObjects(robotBridgeObjects, "UpdateParams", payload)
    if (!ok) {
      console.warn(`[${sceneLabel} bridge] UpdateParams receiver not found. Checked:`, robotBridgeObjects)
    }
  }, [isReady, params, segmentColors])

  useEffect(() => {
    if (!isReady) return
    const gripPayload = JSON.stringify({ grip01 })

    // Primary path: drive ClawController target/input directly
    const setGripOk = sendToObjects(clawBridgeObjects, "SetGrip01", grip01)
    const updateClawOk = sendToObjects(clawBridgeObjects, "UpdateClaw", gripPayload)

    // Optional hard snap if exposed by your script
    sendToObjects(clawBridgeObjects, "ApplyGripImmediate", grip01)

    if (!setGripOk && !updateClawOk) {
      console.warn(`[${sceneLabel} bridge] Claw receiver not found for SetGrip01/UpdateClaw. Checked:`, clawBridgeObjects)
    }
  }, [isReady, grip01])

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-border/50 bg-card">
      <div className="grid-bg absolute inset-0" />
      <canvas id={`${sceneLabel}-canvas`} ref={canvasRef} tabIndex={-1} className="absolute inset-0 z-[1] h-full w-full" />

      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-lg border border-border/50 bg-background/70 px-4 py-3 text-center backdrop-blur-sm">
            <p className="font-display text-sm font-semibold text-foreground">Pick & Place Simulator</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-primary">
              {status === "loading-script" && `Loading ${sceneLabel} loader...`}
              {status === "creating-instance" && `Initializing... ${Math.round(progress * 100)}%`}
              {status === "error" && `${sceneLabel} build not detected`}
              {status === "idle" && "Preparing..."}
            </p>
            {error && <p className="mt-1 max-w-xs text-xs text-destructive">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
