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
    title: "One Segment: Curvature",
    concept:
      "With one active segment, curvature kappa controls how tightly the backbone bends. As kappa increases, bend radius decreases and the shape becomes visibly tighter. Start here to build intuition before adding coupling from later segments.",
    goal: "Use segment 1 only and create a clear bend.",
    challenge: "Raise kappa1 while keeping segment 2 nearly straight.",
    mapPosition: { x: 20, y: 93 },
    initialParams: { kappa1: 0.4, phi1: 0, L1: 0.55, kappa2: 0, phi2: 0, L2: 0.1 },
    rules: {
      paramRanges: [
        { key: "kappa1", min: 4.0 },
        { key: "kappa2", max: 0.2 },
      ],
    },
    requires: [],
  },
  {
    id: 2,
    world: 1,
    title: "One Segment: Bend Direction",
    concept:
      "Phi rotates the bending plane around the segment axis. This means two configurations can have identical bend magnitude but point in very different directions. Learning phi early helps you steer intentionally instead of randomly searching parameter space.",
    goal: "Steer the one-segment bend toward the left side.",
    challenge: "Rotate phi1 near 90 degrees while keeping segment 2 inactive.",
    mapPosition: { x: 44, y: 86 },
    initialParams: { kappa1: 4.2, phi1: 0, L1: 0.55, kappa2: 0, phi2: 0, L2: 0.1 },
    rules: {
      paramRanges: [
        { key: "phi1", min: 80, max: 110 },
        { key: "kappa1", min: 2.5 },
        { key: "kappa2", max: 0.2 },
      ],
    },
    requires: [1],
  },
  {
    id: 3,
    world: 1,
    title: "One Segment: Length and Reach",
    concept:
      "Arc length L scales how far the tip can reach along the bent path. Even with the same kappa and phi, changing L changes workspace size and endpoint position noticeably. In practice, L is a primary lever for coarse reach before fine steering.",
    goal: "Extend segment 1 reach while keeping behavior stable.",
    challenge: "Increase L1 to long reach while segment 2 stays passive.",
    mapPosition: { x: 26, y: 76 },
    initialParams: { kappa1: 2.8, phi1: 45, L1: 0.4, kappa2: 0, phi2: 0, L2: 0.1 },
    rules: {
      paramRanges: [
        { key: "L1", min: 0.75 },
        { key: "kappa2", max: 0.2 },
      ],
    },
    requires: [2],
  },
  {
    id: 4,
    world: 1,
    title: "Two Segments: Interaction",
    concept:
      "The second segment starts from the first segment's local frame, so their effects are coupled. A small base change can strongly alter how downstream segments behave. This is the core shift from single-segment intuition to true continuum-chain control.",
    goal: "Activate segment 2 and feel transform stacking.",
    challenge: "Use both segments with meaningful bend and length.",
    mapPosition: { x: 50, y: 68 },
    initialParams: { kappa1: 2.2, phi1: 10, L1: 0.55, kappa2: 0.2, phi2: 0, L2: 0.2 },
    rules: {
      paramRanges: [
        { key: "kappa2", min: 2.0 },
        { key: "L2", min: 0.45 },
      ],
    },
    requires: [3],
  },
  {
    id: 5,
    world: 1,
    title: "Cooperate or Cancel",
    concept:
      "With two segments, same-plane bends can reinforce while opposite-plane bends can partially cancel. This creates C-like or S-like shapes from the same two modules. Understanding constructive versus destructive interaction is critical for precise shaping.",
    goal: "Create an S-like interaction by opposing bend directions.",
    challenge: "Set segment 2 roughly opposite to segment 1 while both remain curved.",
    mapPosition: { x: 31, y: 58 },
    initialParams: { kappa1: 3.0, phi1: 0, L1: 0.55, kappa2: 2.6, phi2: 20, L2: 0.55 },
    rules: {
      paramRanges: [
        { key: "kappa1", min: 2.0 },
        { key: "kappa2", min: 2.0 },
        { key: "phi2", min: 160, max: 200 },
      ],
    },
    requires: [4],
  },
  {
    id: 6,
    world: 2,
    title: "4+ Segments Control Challenge",
    concept:
      "As segment count grows, control space expands quickly and manual tuning becomes harder. In free simulator mode, add 4+ segments and notice how many equivalent-looking adjustments appear. This lesson builds awareness of dimensionality before formal singularity and redundancy ideas.",
    goal: "In level mode, stabilize proximal control as preparation for high-DOF behavior.",
    challenge: "Keep both base segments in a stable regime.",
    mapPosition: { x: 56, y: 50 },
    initialParams: { kappa1: 3.5, phi1: 20, L1: 0.55, kappa2: 3.0, phi2: 330, L2: 0.55 },
    rules: {
      paramRanges: [
        { key: "kappa1", max: 2.0 },
        { key: "kappa2", max: 2.0 },
      ],
    },
    requires: [5],
  },
  {
    id: 7,
    world: 2,
    title: "Infinite Ways to One Point",
    concept:
      "Continuum robots are redundant: many (kappa, phi, L) combinations can produce very similar tip positions. Reaching one point does not imply one unique configuration. This is powerful for obstacle avoidance but also makes control and optimization more subtle.",
    goal: "Reach a shared target and observe multiple valid parameter choices.",
    challenge: "Hit the target with moderate tolerance.",
    mapPosition: { x: 38, y: 39 },
    initialParams: { kappa1: 1.4, phi1: 15, L1: 0.65, kappa2: 2.4, phi2: 210, L2: 0.55 },
    target: { x: 0.24, y: 0.12, z: 0.78 },
    rules: {
      tipTarget: { point: { x: 0.24, y: 0.12, z: 0.78 }, threshold: 0.13 },
    },
    requires: [6],
  },
  {
    id: 8,
    world: 2,
    title: "Singularity Setup",
    concept:
      "Near singular configurations, direction authority degrades and local controllability becomes poor. Very different inputs may move the tip similarly, or tiny changes may feel unstable. Recognizing these regions is essential for robust planning and safe operation.",
    goal: "Create a near-singular aligned configuration.",
    challenge: "Align bend planes and keep both segments highly curved.",
    mapPosition: { x: 62, y: 30 },
    initialParams: { kappa1: 4.8, phi1: 5, L1: 0.55, kappa2: 4.2, phi2: 35, L2: 0.55 },
    rules: {
      paramRanges: [
        { key: "kappa1", min: 4.0 },
        { key: "kappa2", min: 4.0 },
        { key: "phi2", min: 0, max: 40 },
      ],
    },
    requires: [7],
  },
  {
    id: 9,
    world: 2,
    title: "Escape the Singular Region",
    concept:
      "Back away from singular neighborhoods by separating bend planes and reducing extreme curvature before precision moves. The idea is to recover useful directional sensitivity before final targeting. This mirrors practical workflows: stabilize first, then refine.",
    goal: "Recover controllability and place the tip accurately.",
    challenge: "Reach target after singularity-avoidance adjustments.",
    mapPosition: { x: 46, y: 19 },
    initialParams: { kappa1: 4.5, phi1: 0, L1: 0.55, kappa2: 4.4, phi2: 10, L2: 0.55 },
    target: { x: 0.18, y: -0.16, z: 0.79 },
    rules: {
      tipTarget: { point: { x: 0.18, y: -0.16, z: 0.79 }, threshold: 0.1 },
      paramRanges: [{ key: "phi2", min: 120, max: 300 }],
    },
    requires: [8],
  },
  {
    id: 10,
    world: 2,
    title: "Singularity-Aware Capstone",
    concept:
      "Advanced operation balances redundancy, singularity awareness, obstacle clearance, and safe curvature limits. Strong performance is not just hitting a point, but doing so with controllable and safe shapes. This capstone combines the full practical mindset used in real deployments.",
    goal: "Reach target, avoid obstacle, and stay out of unsafe high-curvature regimes.",
    challenge: "Pass all checks together in one run.",
    mapPosition: { x: 69, y: 10 },
    initialParams: { kappa1: 3.8, phi1: 35, L1: 0.6, kappa2: 3.6, phi2: 250, L2: 0.58 },
    target: { x: 0.27, y: -0.19, z: 0.69 },
    obstacles: [{ x: 0.15, y: -0.02, z: 0.5, radius: 0.11 }],
    rules: {
      tipTarget: { point: { x: 0.27, y: -0.19, z: 0.69 }, threshold: 0.12 },
      avoidObstacles: true,
      paramRanges: [
        { key: "kappa1", max: 6.5 },
        { key: "kappa2", max: 6.5 },
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
