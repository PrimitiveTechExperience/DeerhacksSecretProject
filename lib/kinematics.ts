import type { RobotParams } from "@/lib/types"

export interface Point3 {
  x: number
  y: number
  z: number
}

function matMul(a: number[][], b: number[][]): number[][] {
  const out = Array.from({ length: 4 }, () => Array(4).fill(0))
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      out[i][j] = 0
      for (let k = 0; k < 4; k += 1) {
        out[i][j] += a[i][k] * b[k][j]
      }
    }
  }
  return out
}

function transformPoint(t: number[][], p: Point3): Point3 {
  return {
    x: t[0][0] * p.x + t[0][1] * p.y + t[0][2] * p.z + t[0][3],
    y: t[1][0] * p.x + t[1][1] * p.y + t[1][2] * p.z + t[1][3],
    z: t[2][0] * p.x + t[2][1] * p.y + t[2][2] * p.z + t[2][3],
  }
}

function identity(): number[][] {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ]
}

function segmentTransform(kappa: number, phiDeg: number, s: number): number[][] {
  const phi = (phiDeg * Math.PI) / 180
  const cPhi = Math.cos(phi)
  const sPhi = Math.sin(phi)

  if (Math.abs(kappa) < 1e-6) {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, s],
      [0, 0, 0, 1],
    ]
  }

  const theta = kappa * s
  const c = Math.cos(theta)
  const sn = Math.sin(theta)

  const r00 = cPhi * cPhi * (c - 1) + 1
  const r01 = cPhi * sPhi * (c - 1)
  const r02 = cPhi * sn
  const r10 = cPhi * sPhi * (c - 1)
  const r11 = sPhi * sPhi * (c - 1) + 1
  const r12 = sPhi * sn
  const r20 = -cPhi * sn
  const r21 = -sPhi * sn
  const r22 = c

  const px = cPhi * (1 - c) / kappa
  const py = sPhi * (1 - c) / kappa
  const pz = sn / kappa

  return [
    [r00, r01, r02, px],
    [r10, r11, r12, py],
    [r20, r21, r22, pz],
    [0, 0, 0, 1],
  ]
}

export function sampleRobotPoints(params: RobotParams, samplesPerSegment = 24): Point3[] {
  const points: Point3[] = [{ x: 0, y: 0, z: 0 }]
  const t1End = segmentTransform(params.kappa1, params.phi1, params.L1)
  let tBase = identity()

  for (let i = 1; i <= samplesPerSegment; i += 1) {
    const s = (params.L1 * i) / samplesPerSegment
    const t = matMul(tBase, segmentTransform(params.kappa1, params.phi1, s))
    points.push(transformPoint(t, { x: 0, y: 0, z: 0 }))
  }

  tBase = matMul(tBase, t1End)

  for (let i = 1; i <= samplesPerSegment; i += 1) {
    const s = (params.L2 * i) / samplesPerSegment
    const t = matMul(tBase, segmentTransform(params.kappa2, params.phi2, s))
    points.push(transformPoint(t, { x: 0, y: 0, z: 0 }))
  }

  return points
}

export function computeTipPosition(params: RobotParams): Point3 {
  const points = sampleRobotPoints(params, 1)
  return points[points.length - 1]
}

export function distance3(a: Point3, b: Point3): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}
