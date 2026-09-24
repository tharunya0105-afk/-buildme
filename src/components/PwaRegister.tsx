"use client";

import { useEffect } from "react";

/**
 * Registers the BuildMe service worker for installability + offline shell.
 * Production only — the dev server's HMR conflicts with SW-cached chunks.
 * To test install locally: `npm run build && npm start`.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
