"use client"

import { useEffect } from "react"

/**
 * Registers the service worker so the app is installable as a PWA and serves
 * a cached shell when offline. No-op on browsers without SW support.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal; the app still works online.
      })
    }
    if (document.readyState === "complete") register()
    else {
      window.addEventListener("load", register)
      return () => window.removeEventListener("load", register)
    }
  }, [])

  return null
}
