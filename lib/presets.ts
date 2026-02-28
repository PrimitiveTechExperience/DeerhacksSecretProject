import type { Preset, RobotParams } from './types'

export const DEFAULT_PARAMS: RobotParams = {
  kappa1: 2.0,
  phi1: 0,
  L1: 0.55,
  kappa2: 0,
  phi2: 0,
  L2: 0.5,
}

export const PRESETS: Preset[] = [
  {
    name: 'Home',
    icon: 'home',
    params: { kappa1: 0, phi1: 0, L1: 0.5, kappa2: 0, phi2: 0, L2: 0.5 },
  },
  {
    name: 'Reach Forward',
    icon: 'arrow-up',
    params: { kappa1: 1.5, phi1: 0, L1: 0.8, kappa2: 0.5, phi2: 0, L2: 0.8 },
  },
  {
    name: 'Curve Left',
    icon: 'arrow-left',
    params: { kappa1: 5.0, phi1: 90, L1: 0.6, kappa2: 3.0, phi2: 90, L2: 0.4 },
  },
  {
    name: 'S-Bend',
    icon: 'waves',
    params: { kappa1: 4.0, phi1: 0, L1: 0.5, kappa2: 4.0, phi2: 180, L2: 0.5 },
  },
  {
    name: 'Avoid Obstacle',
    icon: 'shield',
    params: { kappa1: 6.0, phi1: 45, L1: 0.4, kappa2: 3.0, phi2: 270, L2: 0.7 },
  },
]

export const SLIDER_CONFIG = {
  kappa: { min: 0, max: 10, step: 0.1, label: 'Curvature', unit: '1/m' },
  phi: { min: 0, max: 360, step: 1, label: 'Bend Direction', unit: 'deg' },
  L: { min: 0.1, max: 1.0, step: 0.01, label: 'Length', unit: 'm' },
} as const
