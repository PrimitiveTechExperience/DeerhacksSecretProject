"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import type { UnityBuildConfig } from "@/lib/unity-webgl"

type UnityStatus = "idle" | "loading-script" | "creating-instance" | "ready" | "error"

interface UnityInstanceLike {
  SendMessage: (objectName: string, methodName: string, value?: string | number | boolean) => void
  Quit?: () => Promise<void>
}

declare global {
  interface Window {
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: Record<string, unknown>,
      onProgress?: (progress: number) => void
    ) => Promise<UnityInstanceLike>
  }
}

export function useUnityWebGL(canvasRef: RefObject<HTMLCanvasElement | null>, config: UnityBuildConfig) {
  const [status, setStatus] = useState<UnityStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const instanceRef = useRef<UnityInstanceLike | null>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setStatus("loading-script")
      setError(null)

      const script = document.createElement("script")
      script.src = config.loaderUrl
      script.async = true
      scriptRef.current = script

      script.onload = async () => {
        if (cancelled) return
        if (!canvasRef.current || !window.createUnityInstance) {
          setStatus("error")
          setError("Unity loader did not expose createUnityInstance.")
          return
        }

        setStatus("creating-instance")
        try {
          const instance = await window.createUnityInstance(
            canvasRef.current,
            {
              dataUrl: config.dataUrl,
              frameworkUrl: config.frameworkUrl,
              codeUrl: config.codeUrl,
              streamingAssetsUrl: config.streamingAssetsUrl ?? "StreamingAssets",
              companyName: config.companyName,
              productName: config.productName,
              productVersion: config.productVersion,
            },
            (p) => setProgress(p)
          )
          if (cancelled) {
            await instance.Quit?.()
            return
          }
          instanceRef.current = instance
          setStatus("ready")
        } catch (err) {
          setStatus("error")
          const details = err instanceof Error ? err.message : String(err)
          setError(`Could not create Unity instance. ${details}`)
        }
      }

      script.onerror = () => {
        if (cancelled) return
        setStatus("error")
        setError("Could not load Unity loader script. Place WebGL build under /public/unity/Build.")
      }

      document.body.appendChild(script)
    }

    void load()

    return () => {
      cancelled = true
      const instance = instanceRef.current
      instanceRef.current = null
      if (instance?.Quit) {
        void instance.Quit()
      }
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
      }
      scriptRef.current = null
    }
  }, [canvasRef, config])

  const sendMessage = useCallback((objectName: string, methodName: string, value?: string) => {
    if (!instanceRef.current) return false
    try {
      instanceRef.current.SendMessage(objectName, methodName, value ?? "")
      return true
    } catch {
      return false
    }
  }, [])

  return {
    status,
    progress,
    error,
    isReady: status === "ready",
    sendMessage,
  }
}
