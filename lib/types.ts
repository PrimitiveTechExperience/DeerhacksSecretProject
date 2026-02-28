export interface RobotParams {
  kappa1: number
  phi1: number
  L1: number
  kappa2: number
  phi2: number
  L2: number
}

export interface CoachResponse {
  title: string
  what_changed: string[]
  how_it_moves: string
  math_deep_dive: string
  one_tip: string
  safety_note?: string
  short_voice_script: string
}

export interface Preset {
  name: string
  icon: string
  params: RobotParams
}

/** Typed interface for the Unity WebGL bridge - ready for react-unity-webgl */
export interface UnityBridge {
  /** Send updated robot parameters to Unity */
  sendParams: (params: RobotParams) => void
  /** Reset the Unity scene to default */
  resetScene: () => void
  /** Toggle wireframe view */
  toggleWireframe: (enabled: boolean) => void
  /** Whether the Unity instance is loaded */
  isLoaded: boolean
}
