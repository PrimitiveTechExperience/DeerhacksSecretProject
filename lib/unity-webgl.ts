export interface UnityBuildConfig {
  loaderUrl: string
  dataUrl: string
  frameworkUrl: string
  codeUrl: string
  streamingAssetsUrl?: string
  companyName: string
  productName: string
  productVersion: string
}

/**
 * Update these filenames to match your Unity WebGL build output.
 * Place the build under: /public/unity/Build/
 */
export const UNITY_BUILD_CONFIG: UnityBuildConfig = {
  loaderUrl: "/unity/Build/Build.loader.js",
  dataUrl: "/unity/Build/Build.data",
  frameworkUrl: "/unity/Build/Build.framework.js",
  codeUrl: "/unity/Build/Build.wasm",
  streamingAssetsUrl: "StreamingAssets",
  companyName: "ContinuumCoach",
  productName: "ContinuumRobotSimulator",
  productVersion: "0.1.0",
}

