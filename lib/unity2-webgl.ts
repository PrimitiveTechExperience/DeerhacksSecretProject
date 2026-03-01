import type { UnityBuildConfig } from "@/lib/unity-webgl"

export const UNITY2_BUILD_CONFIG: UnityBuildConfig = {
  loaderUrl: "/unity2/Build/unity2.loader.js",
  dataUrl: "/unity2/Build/unity2.data.br",
  frameworkUrl: "/unity2/Build/unity2.framework.js.br",
  codeUrl: "/unity2/Build/unity2.wasm.br",
  streamingAssetsUrl: "StreamingAssets",
  companyName: "ContinuLearn",
  productName: "ContinuLearnPickPlace",
  productVersion: "0.1.0",
}
