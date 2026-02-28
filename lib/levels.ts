import type { RobotParams } from "@/lib/types"
import { computeTipPosition, distance3, sampleRobotPoints, type Point3 } from "@/lib/kinematics"

export interface Obstacle {
  x: number
  y: number
  z: number
  radius: number
}

export interface ParamRangeRule {
  key: keyof RobotParams
  min?: number
  max?: number
}

export interface TipTargetRule {
  point: Point3
  threshold: number
}

export interface LevelConfig {
  id: number
  world: number
  title: string
  concept: string
  goal: string
  challenge: string
  mapPosition?: { x: number; y: number }
  initialParams: RobotParams
  target?: Point3
  obstacles?: Obstacle[]
  rules: {
    tipTarget?: TipTargetRule
    paramRanges?: ParamRangeRule[]
    avoidObstacles?: boolean
  }
  requires: number[]
}

export interface LevelEvaluation {
  passed: boolean
  checks: Array<{ label: string; passed: boolean; detail: string }>
  tipDistance?: number
}

export const LEARNING_LEVELS: LevelConfig[] = [
  {
    id: 1,
    world: 1,
    title: "Straight Setup",
    concept: "When curvature is near zero, a segment acts like a straight link.",
    goal: "Set both segments close to straight and keep lengths balanced.",
    challenge: "Bring both curvatures below 0.2.",
    mapPosition: { x: 20, y: 93 },
    initialParams: { kappa1: 2.2, phi1: 0, L1: 0.5, kappa2: 1.8, phi2: 180, L2: 0.5 },
    rules: {
      paramRanges: [
        { key: "kappa1", max: 0.2 },
        { key: "kappa2", max: 0.2 },
      ],
    },
    requires: [],
  },
  {
    id: 2,
    world: 1,
    title: "Curvature Magnitude",
    concept: "Higher curvature means a tighter arc radius.",
    goal: "Increase segment 1 curvature without maxing out segment 2.",
    challenge: "Set kappa1 high while keeping kappa2 mild.",
    mapPosition: { x: 44, y: 86 },
    initialParams: { kappa1: 0.5, phi1: 0, L1: 0.5, kappa2: 0.5, phi2: 0, L2: 0.5 },
    rules: {
      paramRanges: [
        { key: "kappa1", min: 4.5 },
        { key: "kappa2", max: 2.0 },
      ],
    },
    requires: [1],
  },
  {
    id: 3,
    world: 1,
    title: "Bend Direction",
    concept: "Phi rotates the bend plane around the backbone axis.",
    goal: "Aim segment 1 toward the left side.",
    challenge: "Rotate phi1 to about 90 degrees.",
    mapPosition: { x: 26, y: 76 },
    initialParams: { kappa1: 4, phi1: 0, L1: 0.5, kappa2: 0, phi2: 0, L2: 0.5 },
    rules: {
      paramRanges: [{ key: "phi1", min: 80, max: 110 }],
    },
    requires: [2],
  },
  {
    id: 4,
    world: 1,
    title: "Length Extends Reach",
    concept: "Segment length scales arc length and tip reach.",
    goal: "Increase total reach by extending L2 while staying stable.",
    challenge: "Set L2 above 0.8 and keep kappa2 moderate.",
    mapPosition: { x: 50, y: 68 },
    initialParams: { kappa1: 2, phi1: 0, L1: 0.5, kappa2: 2, phi2: 0, L2: 0.4 },
    rules: {
      paramRanges: [
        { key: "L2", min: 0.8 },
        { key: "kappa2", max: 3.0 },
      ],
    },
    requires: [3],
  },
  {
    id: 5,
    world: 1,
    title: "Pose Stacking",
    concept: "Segment transforms multiply, so later segments build on earlier orientation.",
    goal: "Reach the warm-up target by tuning both segments together.",
    challenge: "Move tip near the target marker.",
    mapPosition: { x: 31, y: 58 },
    initialParams: { kappa1: 1.5, phi1: 0, L1: 0.6, kappa2: 1.5, phi2: 0, L2: 0.6 },
    target: { x: 0.35, y: 0.0, z: 0.85 },
    rules: {
      tipTarget: { point: { x: 0.35, y: 0.0, z: 0.85 }, threshold: 0.12 },
    },
    requires: [4],
  },
  {
    id: 6,
    world: 2,
    title: "C-Shape Reach",
    concept: "Matching bend direction and positive curvature builds a C-shape.",
    goal: "Create a consistent C-shape and hit the target.",
    challenge: "Tune both curvatures to bend in similar direction.",
    mapPosition: { x: 56, y: 50 },
    initialParams: { kappa1: 2, phi1: 0, L1: 0.5, kappa2: 2, phi2: 0, L2: 0.5 },
    target: { x: 0.48, y: 0.0, z: 0.55 },
    rules: {
      tipTarget: { point: { x: 0.48, y: 0.0, z: 0.55 }, threshold: 0.14 },
      paramRanges: [{ key: "phi2", min: 330, max: 360 }],
    },
    requires: [5],
  },
  {
    id: 7,
    world: 2,
    title: "S-Bend",
    concept: "Opposing bend direction creates an inflection and S profile.",
    goal: "Build an S-bend with opposite bending planes.",
    challenge: "Set phi2 opposite phi1 and keep both curved.",
    mapPosition: { x: 38, y: 39 },
    initialParams: { kappa1: 3, phi1: 0, L1: 0.5, kappa2: 3, phi2: 0, L2: 0.5 },
    rules: {
      paramRanges: [
        { key: "kappa1", min: 2.5 },
        { key: "kappa2", min: 2.5 },
        { key: "phi2", min: 165, max: 195 },
      ],
    },
    requires: [6],
  },
  {
    id: 8,
    world: 2,
    title: "Steer Around Obstacle",
    concept: "Distributed actuation lets you route around obstacles.",
    goal: "Reach the target without colliding with the obstacle sphere.",
    challenge: "Keep all sampled points outside the sphere.",
    mapPosition: { x: 62, y: 30 },
    initialParams: { kappa1: 4, phi1: 20, L1: 0.6, kappa2: 2, phi2: 330, L2: 0.6 },
    target: { x: 0.35, y: 0.28, z: 0.62 },
    obstacles: [{ x: 0.2, y: 0.1, z: 0.5, radius: 0.14 }],
    rules: {
      tipTarget: { point: { x: 0.35, y: 0.28, z: 0.62 }, threshold: 0.15 },
      avoidObstacles: true,
    },
    requires: [7],
  },
  {
    id: 9,
    world: 2,
    title: "Precision Tip Placement",
    concept: "Small parameter changes near the end improve precision.",
    goal: "Place the tip accurately on a tight tolerance target.",
    challenge: "Reach with 8 cm tolerance.",
    mapPosition: { x: 46, y: 19 },
    initialParams: { kappa1: 2, phi1: 45, L1: 0.55, kappa2: 3, phi2: 250, L2: 0.55 },
    target: { x: 0.22, y: -0.18, z: 0.77 },
    rules: {
      tipTarget: { point: { x: 0.22, y: -0.18, z: 0.77 }, threshold: 0.08 },
    },
    requires: [8],
  },
  {
    id: 10,
    world: 2,
    title: "World Capstone",
    concept: "Real behavior combines accuracy, safety constraints, and smooth shape control.",
    goal: "Reach target, avoid obstacle, and keep curvature in safe range.",
    challenge: "Pass all checks in one run.",
    mapPosition: { x: 69, y: 10 },
    initialParams: { kappa1: 4, phi1: 40, L1: 0.6, kappa2: 3, phi2: 300, L2: 0.6 },
    target: { x: 0.3, y: -0.24, z: 0.66 },
    obstacles: [{ x: 0.18, y: -0.08, z: 0.48, radius: 0.12 }],
    rules: {
      tipTarget: { point: { x: 0.3, y: -0.24, z: 0.66 }, threshold: 0.12 },
      avoidObstacles: true,
      paramRanges: [
        { key: "kappa1", max: 7.5 },
        { key: "kappa2", max: 7.5 },
      ],
    },
    requires: [9],
  },
]

export function getLevelById(levelId: number): LevelConfig | undefined {
  return LEARNING_LEVELS.find((level) => level.id === levelId)
}

function pointsHitObstacle(points: Point3[], obstacle: Obstacle): boolean {
  return points.some((point) => {
    const d = distance3(point, { x: obstacle.x, y: obstacle.y, z: obstacle.z })
    return d <= obstacle.radius
  })
}

export function evaluateLevel(level: LevelConfig, params: RobotParams): LevelEvaluation {
  const checks: LevelEvaluation["checks"] = []
  let passed = true
  let tipDistance: number | undefined

  if (level.rules.paramRanges?.length) {
    for (const rule of level.rules.paramRanges) {
      const value = params[rule.key]
      const minPass = rule.min === undefined || value >= rule.min
      const maxPass = rule.max === undefined || value <= rule.max
      const ok = minPass && maxPass
      checks.push({
        label: `${rule.key} range`,
        passed: ok,
        detail: `Current ${rule.key}=${value.toFixed(2)}`,
      })
      passed = passed && ok
    }
  }

  if (level.rules.tipTarget) {
    const tip = computeTipPosition(params)
    tipDistance = distance3(tip, level.rules.tipTarget.point)
    const ok = tipDistance <= level.rules.tipTarget.threshold
    checks.push({
      label: "Tip to target",
      passed: ok,
      detail: `Distance ${tipDistance.toFixed(3)}m (<= ${level.rules.tipTarget.threshold.toFixed(3)}m)`,
    })
    passed = passed && ok
  }

  if (level.rules.avoidObstacles && level.obstacles?.length) {
    const points = sampleRobotPoints(params, 28)
    const collision = level.obstacles.some((obstacle) => pointsHitObstacle(points, obstacle))
    const ok = !collision
    checks.push({
      label: "Obstacle clearance",
      passed: ok,
      detail: ok ? "No sampled collision points" : "Collision detected with obstacle volume",
    })
    passed = passed && ok
  }

  return { passed, checks, tipDistance }
}

export function isLevelUnlocked(level: LevelConfig, completedLevelIds: number[]): boolean {
  return level.requires.every((requiredId) => completedLevelIds.includes(requiredId))
}

export function worldProgress(world: number, completedLevelIds: number[]): { done: number; total: number } {
  const levels = LEARNING_LEVELS.filter((level) => level.world === world)
  const done = levels.filter((level) => completedLevelIds.includes(level.id)).length
  return { done, total: levels.length }
}
