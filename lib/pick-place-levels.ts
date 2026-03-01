export interface PickPlaceLevelConfig {
  id: number
  world: number
  title: string
  concept: string
  goal: string
  challenge: string
  mapPosition?: { x: number; y: number }
  requires: number[]
}

export const PICK_PLACE_LEVELS: PickPlaceLevelConfig[] = [
  {
    id: 201,
    world: 5,
    title: "Pick & Place: One Box",
    concept:
      "Control the manipulator to approach, grasp, and place a single box at a chosen placement location. Focus on smooth alignment before gripping so the object remains stable. This level introduces core manipulation flow in a constrained scene.",
    goal: "Pick one box and place it cleanly at your intended location.",
    challenge: "Complete one clean pickup and placement without dropping the object.",
    mapPosition: { x: 26, y: 82 },
    requires: [],
  },
  {
    id: 202,
    world: 5,
    title: "Pick & Place: Two Boxes Sequence",
    concept:
      "Manipulate two boxes in a required order while maintaining placement accuracy. You must plan approach paths and timing between picks to avoid collisions or misplacement. This level introduces sequencing and task-level control complexity.",
    goal: "Pick and place two boxes in the specified order.",
    challenge: "Place both boxes correctly in sequence to pass.",
    mapPosition: { x: 58, y: 66 },
    requires: [201],
  },
]

export function getPickPlaceLevelById(levelId: number): PickPlaceLevelConfig | undefined {
  return PICK_PLACE_LEVELS.find((level) => level.id === levelId)
}
