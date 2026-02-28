# Unity WebGL Integration

## Build output location

Place Unity WebGL build files under:

- `public/unity/Build/Unity.loader.js`
- `public/unity/Build/Unity.framework.js.br`
- `public/unity/Build/Unity.data.br`
- `public/unity/Build/Unity.wasm.br`

If names differ, update:

- `lib/unity-webgl.ts`

## React integration points

- Loader hook: `hooks/use-unity-webgl.ts`
- UI slot component: `components/simulator/unity-placeholder.tsx`

## Unity methods expected

GameObject: `RobotController`

Methods:

- `UpdateParams(string json)`
- `UpdateLevelContext(string json)` (optional but recommended)
