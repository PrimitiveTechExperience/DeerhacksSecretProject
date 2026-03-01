import type { UnityBuildConfig } from "@/lib/unity-webgl"

export const UNITY3_BUILD_CONFIG: UnityBuildConfig = {
  loaderUrl: "/unity3/Build/unity3.loader.js",
  dataUrl: "/unity3/Build/unity3.data.br",
  frameworkUrl: "/unity3/Build/unity3.framework.js.br",
  codeUrl: "/unity3/Build/unity3.wasm.br",
  streamingAssetsUrl: "StreamingAssets",
  companyName: "ContinuLearn",
  productName: "ContinuLearnPickPlaceL2",
  productVersion: "0.1.0",
}
