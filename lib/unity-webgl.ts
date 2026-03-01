export interface UnityBuildConfig {
  loaderUrl: string
  dataUrl: string
  frameworkUrl: string
  codeUrl: string
  streamingAssetsUrl?: string
  bridgeObjectNames?: string[]
  companyName: string
  productName: string
  productVersion: string
}

/**
 * Update these filenames to match your Unity WebGL build output.
 * Place the build under: /public/unity/Build/
 */
export const UNITY_BUILD_CONFIG: UnityBuildConfig = {
  loaderUrl: "/unity/Build/Unity.loader.js",
  dataUrl: "/unity/Build/Unity.data.br",
  frameworkUrl: "/unity/Build/Unity.framework.js.br",
  codeUrl: "/unity/Build/Unity.wasm.br",
  streamingAssetsUrl: "StreamingAssets",
  bridgeObjectNames: ["robot", "RobotController", "ContinuumSegmentController"],
  companyName: "ContinuLearn",
  productName: "ContinuLearnSimulator",
  productVersion: "0.1.0",
}
