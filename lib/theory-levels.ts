export interface TheoryLevel {
  id: number
  world: number
  title: string
  concept: string
  lesson: string
  problem: string
  mapPosition?: { x: number; y: number }
  requires: number[]
}

export const THEORY_LEVELS: TheoryLevel[] = [
  {
    id: 101,
    world: 3,
    title: "Constant Curvature Basics",
    concept: "Model each segment as a circular arc with constant curvature.",
    lesson:
      "For one segment, radius is $r=\\frac{1}{\\kappa}$ and bend angle is $\\theta=\\kappa L$. As $\\kappa\\to 0$, the segment approaches a straight line.",
    problem:
      "Given $\\kappa=2\\;\\text{m}^{-1}$ and $L=0.4\\;\\text{m}$, compute $r$ and $\\theta$. Explain what shape you expect.",
    mapPosition: { x: 20, y: 93 },
    requires: [],
  },
  {
    id: 102,
    world: 3,
    title: "Arc Length and Radius",
    concept: "Curvature and arc geometry determine tip displacement.",
    lesson:
      "Planar arc end-point for angle $\\theta$ and radius $r$ is often analyzed via $x=r(1-\\cos\\theta),\\;z=r\\sin\\theta$ in local frame.",
    problem:
      "Use $\\kappa=1.5$, $L=0.6$ to get $\\theta$. Then write local $x,z$ using $r=1/\\kappa$.",
    mapPosition: { x: 44, y: 86 },
    requires: [101],
  },
  {
    id: 103,
    world: 3,
    title: "Bending Plane Rotation",
    concept: "$\\phi$ rotates the bending plane in 3D.",
    lesson:
      "You can think of each segment as: rotate by $\\phi$, bend by $\\kappa,L$, then transform to world frame. This couples lateral and vertical reach.",
    problem:
      "If two configurations share same $(\\kappa,L)$ but have $\\phi=0^\\circ$ and $90^\\circ$, describe how tip direction differs.",
    mapPosition: { x: 26, y: 76 },
    requires: [102],
  },
  {
    id: 104,
    world: 3,
    title: "Homogeneous Transform Intuition",
    concept: "Pose stacking uses matrix multiplication.",
    lesson:
      "Two-segment tip pose is $T_{tip}=T_1T_2$. Order matters because each second-segment motion occurs in segment-1's transformed frame.",
    problem:
      "Why is $T_1T_2 \\neq T_2T_1$ for most continuum configurations? Give a physical interpretation.",
    mapPosition: { x: 50, y: 68 },
    requires: [103],
  },
  {
    id: 105,
    world: 4,
    title: "Jacobian Meaning",
    concept: "Jacobian maps parameter changes to tip velocity.",
    lesson:
      "For parameters $q=[\\kappa_1,\\phi_1,L_1,\\kappa_2,\\phi_2,L_2]^T$, local linear motion is $\\dot{x}\\approx J(q)\\dot{q}$ near current pose.",
    problem:
      "Explain why Jacobian-based control is local and can fail far from linearization point.",
    mapPosition: { x: 31, y: 58 },
    requires: [104],
  },
  {
    id: 106,
    world: 4,
    title: "Constraint-Aware Control",
    concept: "Optimization balances target accuracy and safety constraints.",
    lesson:
      "A common form is minimize $\\|x(q)-x^*\\|^2 + \\lambda\\|\\Delta q\\|^2$ subject to bounds on $\\kappa$ and collision constraints.",
    problem:
      "Write two reasons adding $\\lambda\\|\\Delta q\\|^2$ improves real robot behavior.",
    mapPosition: { x: 56, y: 50 },
    requires: [105],
  },
  {
    id: 107,
    world: 4,
    title: "Stability and Sensitivity",
    concept: "High curvature regions can amplify parameter sensitivity.",
    lesson:
      "Near singular or high-curvature states, small parameter changes can cause large tip motion; this motivates damping and step limits.",
    problem:
      "Describe one diagnostic you would monitor to detect unstable updates during teleoperation.",
    mapPosition: { x: 38, y: 39 },
    requires: [106],
  },
  {
    id: 108,
    world: 4,
    title: "Theory Capstone",
    concept: "Connect geometry, transforms, and constrained control into one reasoning pipeline.",
    lesson:
      "A robust strategy: geometric intuition for initialization, transform-based prediction, then constrained iterative refinement.",
    problem:
      "Design a short 4-step algorithm for reaching a target while avoiding obstacle and keeping curvature under a safe limit.",
    mapPosition: { x: 62, y: 30 },
    requires: [107],
  },
]

export function getTheoryLevelById(levelId: number): TheoryLevel | undefined {
  return THEORY_LEVELS.find((level) => level.id === levelId)
}

export function worldProgressTheory(world: number, completedLevelIds: number[]): { done: number; total: number } {
  const levels = THEORY_LEVELS.filter((level) => level.world === world)
  const done = levels.filter((level) => completedLevelIds.includes(level.id)).length
  return { done, total: levels.length }
}

