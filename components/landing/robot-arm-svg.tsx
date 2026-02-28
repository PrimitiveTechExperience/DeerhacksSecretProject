"use client"

import { useEffect, useState } from "react"

/**
 * Animated SVG of a 2-segment continuum robot.
 * Uses real arc math: given (kappa, phi, L), each segment bends in a circular arc.
 * The animation cycles through different configurations to demonstrate bending.
 */

interface Config {
  kappa1: number
  phi1: number
  L1: number
  kappa2: number
  phi2: number
  L2: number
}

const CONFIGS: Config[] = [
  { kappa1: 3, phi1: 0, L1: 0.4, kappa2: 5, phi2: 90, L2: 0.35 },
  { kappa1: 6, phi1: 45, L1: 0.35, kappa2: 2, phi2: -60, L2: 0.4 },
  { kappa1: 1, phi1: -30, L1: 0.45, kappa2: 8, phi2: 180, L2: 0.3 },
  { kappa1: 7, phi1: 90, L1: 0.3, kappa2: 4, phi2: 0, L2: 0.45 },
  { kappa1: 4, phi1: -90, L1: 0.4, kappa2: 6, phi2: 45, L2: 0.35 },
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpConfig(a: Config, b: Config, t: number): Config {
  return {
    kappa1: lerp(a.kappa1, b.kappa1, t),
    phi1: lerp(a.phi1, b.phi1, t),
    L1: lerp(a.L1, b.L1, t),
    kappa2: lerp(a.kappa2, b.kappa2, t),
    phi2: lerp(a.phi2, b.phi2, t),
    L2: lerp(a.L2, b.L2, t),
  }
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Given curvature kappa (1/m) and length L (m), compute SVG points along the arc
 * in 2D (projected via phi). Returns array of {x, y} in SVG space.
 */
function computeArcPoints(
  startX: number,
  startY: number,
  startAngle: number,
  kappa: number,
  L: number,
  numPoints: number,
  scale: number
): { points: { x: number; y: number }[]; endAngle: number } {
  const points: { x: number; y: number }[] = []
  const totalArc = kappa * L // total bend angle in radians-ish (kappa in 1/m, L in m)
  const scaledL = L * scale

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const s = t * scaledL

    if (kappa < 0.01) {
      // Nearly straight
      const x = startX + s * Math.sin(startAngle)
      const y = startY - s * Math.cos(startAngle)
      points.push({ x, y })
    } else {
      const r = scaledL / (kappa * L) // radius in SVG units
      const theta = t * totalArc
      const x = startX + r * (Math.sin(startAngle + theta) - Math.sin(startAngle))
      const y = startY - r * (Math.cos(startAngle) - Math.cos(startAngle + theta))
      points.push({ x, y })
    }
  }

  const endAngle = startAngle + totalArc
  return { points, endAngle }
}

function pointsToSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ""
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`
  }
  return d
}

export function RobotArmSVG() {
  const [configIndex, setConfigIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame: number
    let start: number | null = null
    const duration = 2500 // ms per transition

    function animate(timestamp: number) {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const raw = Math.min(elapsed / duration, 1)
      setProgress(easeInOutCubic(raw))

      if (raw >= 1) {
        setConfigIndex((prev) => (prev + 1) % CONFIGS.length)
        start = null
        setProgress(0)
      }
      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [configIndex])

  const from = CONFIGS[configIndex]
  const to = CONFIGS[(configIndex + 1) % CONFIGS.length]
  const current = lerpConfig(from, to, progress)

  const baseX = 200
  const baseY = 370
  const scale = 350

  // Compute segment 1
  const phiRad1 = (current.phi1 * Math.PI) / 180
  const seg1 = computeArcPoints(
    baseX,
    baseY,
    phiRad1 * 0.3,
    current.kappa1,
    current.L1,
    24,
    scale
  )

  // Compute segment 2 starting from end of segment 1
  const lastPt1 = seg1.points[seg1.points.length - 1]
  const phiRad2 = (current.phi2 * Math.PI) / 180
  const seg2 = computeArcPoints(
    lastPt1.x,
    lastPt1.y,
    seg1.endAngle + phiRad2 * 0.3,
    current.kappa2,
    current.L2,
    24,
    scale
  )

  const path1 = pointsToSmoothPath(seg1.points)
  const path2 = pointsToSmoothPath(seg2.points)
  const tipPt = seg2.points[seg2.points.length - 1]
  const jointPt = seg1.points[seg1.points.length - 1]

  return (
    <div className="relative animate-float">
      <svg
        viewBox="0 0 400 420"
        className="h-auto w-full max-w-[420px]"
        aria-label="Animated 2-segment continuum robot illustration"
        role="img"
      >
        {/* Dimension markers */}
        <line x1="185" y1="380" x2="215" y2="380" stroke="currentColor" strokeWidth="1" opacity="0.15" className="text-primary" />
        <line x1="200" y1="375" x2="200" y2="385" stroke="currentColor" strokeWidth="1" opacity="0.15" className="text-primary" />

        {/* Base platform */}
        <rect
          x="165"
          y="370"
          width="70"
          height="14"
          rx="3"
          className="fill-secondary stroke-border"
          strokeWidth="1"
        />
        <rect
          x="180"
          y="366"
          width="40"
          height="8"
          rx="2"
          className="fill-muted stroke-border"
          strokeWidth="0.5"
        />
        {/* Base indicator light */}
        <circle cx="200" cy="377" r="2" className="fill-primary arm-pulse" />

        {/* Segment 1 - thicker, outer glow */}
        <path
          d={path1}
          fill="none"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.06"
          className="text-primary"
        />
        {/* Segment 1 - main body */}
        <path
          d={path1}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.25"
          className="text-primary"
        />
        <path
          d={path1}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-primary arm-pulse"
        />
        {/* Segment 1 inner highlight */}
        <path
          d={path1}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
          className="text-primary-foreground dark:text-primary"
          strokeDasharray="2 6"
        />

        {/* Joint ring */}
        <circle
          cx={jointPt.x}
          cy={jointPt.y}
          r="7"
          className="fill-background stroke-primary"
          strokeWidth="2"
        />
        <circle
          cx={jointPt.x}
          cy={jointPt.y}
          r="3"
          className="fill-primary"
          opacity="0.8"
        />

        {/* Segment 2 - outer glow */}
        <path
          d={path2}
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.06"
          className="text-primary"
        />
        {/* Segment 2 - main body */}
        <path
          d={path2}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.2"
          className="text-primary"
        />
        <path
          d={path2}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-primary arm-pulse"
        />
        {/* Segment 2 inner highlight */}
        <path
          d={path2}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
          className="text-primary-foreground dark:text-primary"
          strokeDasharray="2 6"
        />

        {/* Tip / end-effector */}
        <circle
          cx={tipPt.x}
          cy={tipPt.y}
          r="5"
          className="fill-primary glow-ring"
        />
        <circle
          cx={tipPt.x}
          cy={tipPt.y}
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.15"
          className="text-primary"
        />

        {/* HUD overlay: kappa readout near joint */}
        <text
          x={jointPt.x + 15}
          y={jointPt.y - 10}
          className="fill-muted-foreground font-mono"
          fontSize="8"
          opacity="0.5"
        >
          {`\u03BA=${current.kappa1.toFixed(1)}`}
        </text>

        {/* HUD overlay: kappa readout near tip */}
        <text
          x={tipPt.x + 12}
          y={tipPt.y - 8}
          className="fill-muted-foreground font-mono"
          fontSize="8"
          opacity="0.5"
        >
          {`\u03BA=${current.kappa2.toFixed(1)}`}
        </text>
      </svg>
    </div>
  )
}
