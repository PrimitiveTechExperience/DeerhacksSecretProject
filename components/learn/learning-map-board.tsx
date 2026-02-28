"use client"

import { useMemo, useRef, useState, type MouseEvent, type WheelEvent } from "react"
import { Check, Lock, Minus, Plus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MapPoint {
  x: number
  y: number
}

interface LearningMapBoardProps {
  levels: Array<{ id: number; mapPosition?: { x: number; y: number }; requires: number[] }>
  completed: number[]
  currentLevelId?: number
  onOpenLevel: (levelId: number) => void
}

const VIEWBOX_WIDTH = 1000
const VIEWBOX_HEIGHT = 1600
const NODE_RADIUS = 24

function generateSnakePoints(count: number): MapPoint[] {
  if (count <= 0) return []
  const points: MapPoint[] = []
  const yTop = 10
  const yBottom = 93
  const step = count > 1 ? (yBottom - yTop) / (count - 1) : 0

  for (let i = 0; i < count; i += 1) {
    const lane = i % 2 === 0 ? 22 : 66
    const wobble = (i % 4) * 3
    points.push({
      x: lane + (i % 2 === 0 ? wobble : -wobble),
      y: yBottom - i * step,
    })
  }

  return points
}

function toSvgPoint(point: MapPoint): MapPoint {
  return {
    x: (point.x / 100) * VIEWBOX_WIDTH,
    y: (point.y / 100) * VIEWBOX_HEIGHT,
  }
}

function pathThroughPoints(points: MapPoint[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2

    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function LearningMapBoard({ levels, completed, currentLevelId, onOpenLevel }: LearningMapBoardProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)

  const minZoom = 1
  const maxZoom = 2.5
  const zoomStep = 0.25

  const points = useMemo(() => {
    const fallback = generateSnakePoints(levels.length)
    return levels.map((level, index) => toSvgPoint(level.mapPosition ?? fallback[index]))
  }, [levels])
  const boardPath = useMemo(() => pathThroughPoints(points), [points])
  const isUnlocked = (level: { requires: number[] }) =>
    level.requires.every((requiredId) => completed.includes(requiredId))

  const clampPan = (nextPan: { x: number; y: number }, targetZoom: number) => {
    const viewport = viewportRef.current
    if (!viewport) return nextPan

    const maxX = ((targetZoom - 1) * viewport.clientWidth) / 2
    const maxY = ((targetZoom - 1) * viewport.clientHeight) / 2

    return {
      x: Math.max(-maxX, Math.min(maxX, nextPan.x)),
      y: Math.max(-maxY, Math.min(maxY, nextPan.y)),
    }
  }

  const updateZoom = (nextZoom: number) => {
    setZoom((prevZoom) => {
      const bounded = Math.max(minZoom, Math.min(maxZoom, Number(nextZoom.toFixed(2))))
      if (bounded === prevZoom) return prevZoom
      if (bounded === 1) {
        setPan({ x: 0, y: 0 })
      } else {
        setPan((prevPan) => clampPan(prevPan, bounded))
      }
      return bounded
    })
  }

  const zoomIn = () => updateZoom(zoom + zoomStep)
  const zoomOut = () => updateZoom(zoom - zoomStep)
  const zoomReset = () => {
    updateZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const onWheelZoom = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? -zoomStep : zoomStep
    updateZoom(zoom + delta)
  }

  const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) return
    setIsDragging(true)
    dragStartRef.current = { x: event.clientX, y: event.clientY }
    panStartRef.current = pan
  }

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return
    const dx = event.clientX - dragStartRef.current.x
    const dy = event.clientY - dragStartRef.current.y
    const nextPan = {
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    }
    setPan(clampPan(nextPan, zoom))
  }

  const onMouseUp = () => {
    setIsDragging(false)
    dragStartRef.current = null
  }

  return (
    <div className="relative min-h-[78vh] bg-[radial-gradient(circle_at_top_left,oklch(0.7_0.17_55_/_0.11),transparent_45%),radial-gradient(circle_at_bottom_right,oklch(0.65_0.18_260_/_0.08),transparent_42%)] p-3 sm:p-6">
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-lg border border-border/60 bg-card/80 p-1 backdrop-blur">
        <Button variant="ghost" size="icon" className="size-8" onClick={zoomOut} disabled={zoom <= minZoom}>
          <Minus className="size-4" />
        </Button>
        <span className="w-14 text-center font-mono text-[11px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="size-8" onClick={zoomIn} disabled={zoom >= maxZoom}>
          <Plus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={zoomReset} disabled={zoom === 1}>
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div
        ref={viewportRef}
        className={`h-[78vh] overflow-hidden rounded-xl ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
        onWheel={onWheelZoom}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="relative h-full w-full">
          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <path d={boardPath} fill="none" stroke="oklch(0.56 0.13 55 / 0.35)" strokeWidth={34} strokeLinecap="round" />
            <path d={boardPath} fill="none" stroke="oklch(0.67 0.16 55 / 0.7)" strokeWidth={12} strokeLinecap="round" />

            {levels.map((level, index) => {
              const point = points[index]
              if (!point) return null
              const done = completed.includes(level.id)
              const unlocked = done || isUnlocked(level)
              const isCurrent = !done && unlocked && level.id === currentLevelId

              return (
                <g
                  key={level.id}
                  onClick={() => unlocked && onOpenLevel(level.id)}
                  className={unlocked ? "cursor-pointer" : "cursor-not-allowed"}
                  role="button"
                  tabIndex={unlocked ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!unlocked) return
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onOpenLevel(level.id)
                    }
                  }}
                  aria-label={`Open level ${level.id}`}
                >
                  {isCurrent && (
                    <>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={NODE_RADIUS + 8}
                        fill="none"
                        stroke="oklch(0.72 0.16 55 / 0.75)"
                        strokeWidth={3}
                        opacity={0.9}
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={NODE_RADIUS + 13}
                        fill="none"
                        stroke="oklch(0.72 0.16 55 / 0.35)"
                        strokeWidth={2}
                        className="animate-pulse"
                      />
                    </>
                  )}

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={NODE_RADIUS}
                    fill={done ? "oklch(0.7 0.17 55)" : unlocked ? "oklch(0.12 0.025 260 / 0.95)" : "oklch(0.2 0.02 260 / 0.85)"}
                    stroke={
                      done
                        ? "oklch(0.72 0.16 55 / 0.95)"
                        : isCurrent
                          ? "oklch(0.72 0.16 55 / 0.95)"
                          : unlocked
                            ? "oklch(0.72 0.16 55 / 0.55)"
                            : "oklch(0.32 0.02 260 / 0.9)"
                    }
                    strokeWidth={isCurrent ? 3 : 2}
                  />
                  {done ? (
                    <Check
                      size={18}
                      x={point.x - 9}
                      y={point.y - 9}
                      color="oklch(0.15 0.03 55)"
                      strokeWidth={2.5}
                    />
                  ) : unlocked ? (
                    <text
                      x={point.x}
                      y={point.y + 6}
                      textAnchor="middle"
                      fontSize={isCurrent ? 30 : 26}
                      fontWeight="700"
                      fill={isCurrent ? "oklch(0.8 0.15 75)" : "oklch(0.72 0.16 55)"}
                    >
                      {level.id}
                    </text>
                  ) : (
                    <Lock
                      size={16}
                      x={point.x - 8}
                      y={point.y - 8}
                      color="oklch(0.7 0.01 85 / 0.75)"
                      strokeWidth={2}
                    />
                  )}
                  <text
                    x={point.x}
                    y={point.y + NODE_RADIUS + 22}
                    textAnchor="middle"
                    fontSize={15}
                    fill={isCurrent ? "oklch(0.78 0.1 75)" : "oklch(0.55 0.015 85)"}
                    style={{ pointerEvents: "none" }}
                  >
                    L{level.id}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}
