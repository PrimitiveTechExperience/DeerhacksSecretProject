"use client"

import { useEffect, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  ArrowUp,
  ArrowLeft,
  Waves,
  Shield,
} from "lucide-react"
import type { RobotParams } from "@/lib/types"
import { PRESETS, SLIDER_CONFIG } from "@/lib/presets"

const presetIcons: Record<string, React.ElementType> = {
  home: Home,
  "arrow-up": ArrowUp,
  "arrow-left": ArrowLeft,
  waves: Waves,
  shield: Shield,
}

interface ControlPanelProps {
  params: RobotParams
  segmentCount?: number
  segmentColors: { s1: string; s2: string }
  extraSegments: Array<{ kappa: number; phiDeg: number; length: number; color: string }>
  maxSegments: number
  isLocked: boolean
  onParamsChange: (params: RobotParams) => void
  onSegmentColorChange: (segment: "s1" | "s2", color: string) => void
  onAddSegment: () => void
  onRemoveSegment: () => void
  onExtraSegmentChange: (index: number, key: "kappa" | "phiDeg" | "length" | "color", value: number | string) => void
}

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (val: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-wide text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-semibold text-primary">
          {value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}
          <span className="ml-0.5 text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  )
}

function SegmentColorPicker({
  segmentKey,
  color,
  onConfirm,
}: {
  segmentKey: "s1" | "s2"
  color: string
  onConfirm: (segment: "s1" | "s2", color: string) => void
}) {
  const [draftColor, setDraftColor] = useState(color)

  useEffect(() => {
    setDraftColor(color)
  }, [color])

  return (
    <details className="rounded-md border border-border/40 bg-secondary/20">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs">
        <span className="font-mono tracking-wider text-muted-foreground uppercase">Change Color</span>
        <span className="inline-flex items-center gap-2">
          <span
            className="size-4 rounded border border-border/60"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="font-mono text-[11px] text-foreground">{color.toUpperCase()}</span>
        </span>
      </summary>
      <div className="flex items-center gap-2 border-t border-border/40 px-3 py-2">
        <input
          type="color"
          value={draftColor}
          onChange={(e) => setDraftColor(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border/60 bg-transparent p-0"
          aria-label="Pick segment color"
        />
        <div className="font-mono text-[11px] text-muted-foreground">{draftColor.toUpperCase()}</div>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto h-8 border-primary/40 text-xs hover:border-primary hover:text-primary"
          onClick={() => onConfirm(segmentKey, draftColor)}
        >
          Confirm
        </Button>
      </div>
    </details>
  )
}

function ExtraSegmentColorPicker({
  segmentIndex,
  color,
  onConfirm,
}: {
  segmentIndex: number
  color: string
  onConfirm: (index: number, color: string) => void
}) {
  const [draftColor, setDraftColor] = useState(color)

  useEffect(() => {
    setDraftColor(color)
  }, [color])

  return (
    <details className="rounded-md border border-border/40 bg-secondary/20">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs">
        <span className="font-mono tracking-wider text-muted-foreground uppercase">Change Color</span>
        <span className="inline-flex items-center gap-2">
          <span className="size-4 rounded border border-border/60" style={{ backgroundColor: color }} />
          <span className="font-mono text-[11px] text-foreground">{color.toUpperCase()}</span>
        </span>
      </summary>
      <div className="flex items-center gap-2 border-t border-border/40 px-3 py-2">
        <input
          type="color"
          value={draftColor}
          onChange={(e) => setDraftColor(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border/60 bg-transparent p-0"
          aria-label={`Pick segment ${segmentIndex + 3} color`}
        />
        <div className="font-mono text-[11px] text-muted-foreground">{draftColor.toUpperCase()}</div>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto h-8 border-primary/40 text-xs hover:border-primary hover:text-primary"
          onClick={() => onConfirm(segmentIndex, draftColor)}
        >
          Confirm
        </Button>
      </div>
    </details>
  )
}

export function ControlPanel({
  params,
  segmentCount = 1,
  segmentColors,
  extraSegments,
  maxSegments,
  isLocked,
  onParamsChange,
  onSegmentColorChange,
  onAddSegment,
  onRemoveSegment,
  onExtraSegmentChange,
}: ControlPanelProps) {
  const updateParam = (key: keyof RobotParams, value: number) => {
    onParamsChange({ ...params, [key]: value })
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-xl border border-border/50 bg-card p-5">
      <div>
        <h2 className="font-display text-sm font-bold tracking-wide text-foreground">
          Parameters
        </h2>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {segmentCount}-segment continuum robot
          </p>
          {!isLocked && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 font-mono text-[10px]"
                onClick={onRemoveSegment}
                disabled={segmentCount <= 1}
              >
                - Remove
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 px-2 font-mono text-[10px]"
                onClick={onAddSegment}
                disabled={segmentCount >= maxSegments}
              >
                + Add Segment
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Segment 1 */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
            S1
          </span>
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Segment 1</span>
        </div>
        <ParamSlider
          label={SLIDER_CONFIG.kappa.label}
          value={params.kappa1}
          min={SLIDER_CONFIG.kappa.min}
          max={SLIDER_CONFIG.kappa.max}
          step={SLIDER_CONFIG.kappa.step}
          unit={SLIDER_CONFIG.kappa.unit}
          onChange={(v) => updateParam("kappa1", v)}
        />
        <ParamSlider
          label={SLIDER_CONFIG.phi.label}
          value={params.phi1}
          min={SLIDER_CONFIG.phi.min}
          max={SLIDER_CONFIG.phi.max}
          step={SLIDER_CONFIG.phi.step}
          unit={SLIDER_CONFIG.phi.unit}
          onChange={(v) => updateParam("phi1", v)}
        />
        <ParamSlider
          label={SLIDER_CONFIG.L.label}
          value={params.L1}
          min={SLIDER_CONFIG.L.min}
          max={SLIDER_CONFIG.L.max}
          step={SLIDER_CONFIG.L.step}
          unit={SLIDER_CONFIG.L.unit}
          onChange={(v) => updateParam("L1", v)}
        />
        <SegmentColorPicker segmentKey="s1" color={segmentColors.s1} onConfirm={onSegmentColorChange} />
      </div>

      {segmentCount > 1 && (
        <>
          <Separator className="bg-border/50" />

          {/* Segment 2 */}
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
                S2
              </span>
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Segment 2</span>
            </div>
            <ParamSlider
              label={SLIDER_CONFIG.kappa.label}
              value={params.kappa2}
              min={SLIDER_CONFIG.kappa.min}
              max={SLIDER_CONFIG.kappa.max}
              step={SLIDER_CONFIG.kappa.step}
              unit={SLIDER_CONFIG.kappa.unit}
              onChange={(v) => updateParam("kappa2", v)}
            />
            <ParamSlider
              label={SLIDER_CONFIG.phi.label}
              value={params.phi2}
              min={SLIDER_CONFIG.phi.min}
              max={SLIDER_CONFIG.phi.max}
              step={SLIDER_CONFIG.phi.step}
              unit={SLIDER_CONFIG.phi.unit}
              onChange={(v) => updateParam("phi2", v)}
            />
            <ParamSlider
              label={SLIDER_CONFIG.L.label}
              value={params.L2}
              min={SLIDER_CONFIG.L.min}
              max={SLIDER_CONFIG.L.max}
              step={SLIDER_CONFIG.L.step}
              unit={SLIDER_CONFIG.L.unit}
              onChange={(v) => updateParam("L2", v)}
            />
            <SegmentColorPicker segmentKey="s2" color={segmentColors.s2} onConfirm={onSegmentColorChange} />
          </div>
        </>
      )}

      {extraSegments.map((segment, index) => (
        <div key={`s-extra-${index}`} className="flex flex-col gap-3">
          <Separator className="bg-border/50" />
          <div className="inline-flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
              S{index + 3}
            </span>
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Segment {index + 3}
            </span>
          </div>
          <ParamSlider
            label={SLIDER_CONFIG.kappa.label}
            value={segment.kappa}
            min={SLIDER_CONFIG.kappa.min}
            max={SLIDER_CONFIG.kappa.max}
            step={SLIDER_CONFIG.kappa.step}
            unit={SLIDER_CONFIG.kappa.unit}
            onChange={(v) => onExtraSegmentChange(index, "kappa", v)}
          />
          <ParamSlider
            label={SLIDER_CONFIG.phi.label}
            value={segment.phiDeg}
            min={SLIDER_CONFIG.phi.min}
            max={SLIDER_CONFIG.phi.max}
            step={SLIDER_CONFIG.phi.step}
            unit={SLIDER_CONFIG.phi.unit}
            onChange={(v) => onExtraSegmentChange(index, "phiDeg", v)}
          />
          <ParamSlider
            label={SLIDER_CONFIG.L.label}
            value={segment.length}
            min={SLIDER_CONFIG.L.min}
            max={SLIDER_CONFIG.L.max}
            step={SLIDER_CONFIG.L.step}
            unit={SLIDER_CONFIG.L.unit}
            onChange={(v) => onExtraSegmentChange(index, "length", v)}
          />
          <ExtraSegmentColorPicker
            segmentIndex={index}
            color={segment.color}
            onConfirm={(segmentIndex, color) => onExtraSegmentChange(segmentIndex, "color", color)}
          />
        </div>
      ))}

      <Separator className="bg-border/50" />

      {/* Presets */}
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Presets</span>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => {
            const Icon = presetIcons[preset.icon] ?? Home
            return (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                className="justify-start gap-2 border-border/50 font-mono text-xs hover:border-primary/40 hover:text-primary"
                onClick={() => onParamsChange(preset.params)}
              >
                <Icon className="size-3.5" />
                {preset.name}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
