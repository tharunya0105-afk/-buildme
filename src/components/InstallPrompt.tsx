"use client";

// ─── Install App Prompt ──────────────────────────────────────────────────────
// Android/desktop Chrome/Edge: fires `beforeinstallprompt` → one-tap install.
// iOS Safari: no programmatic prompt — shows the exact Add-to-Home-Screen steps.
// Dismissal is remembered (localStorage) so it never nags.

import { useEffect, useState } from "react";
import { X, Download, Share, PlusSquare } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "buildme-install-dismissed";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Standalone already = installed; never show.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };

    if (isIos) {
      // Small delay so it doesn't fight the first paint.
      const t = setTimeout(() => setShowIos(true), 2500);
      return () => clearTimeout(t);
    }

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowIos(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") dismiss();
  };

  if (!visible && !showIos) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-border bg-white p-4 shadow-xl sm:left-4 sm:right-auto sm:mx-0">
      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="absolute right-2 top-2 rounded-lg p-1 text-text-muted hover:bg-surface-alt"
      >
        <X className="h-4 w-4" />
      </button>

      {deferred ? (
        <>
          <p className="pr-6 text-sm font-semibold">Install BuildMe</p>
          <p className="mt-0.5 pr-6 text-caption text-text-muted">
            Add to your home screen for full-screen, offline-ready access.
          </p>
          <button
            onClick={install}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
          >
            <Download className="h-4 w-4" /> Install app
          </button>
        </>
      ) : (
        <>
          <p className="pr-6 text-sm font-semibold">Install BuildMe on your iPhone</p>
          <ol className="mt-1.5 space-y-1 pr-6 text-caption text-text-secondary">
            <li className="flex items-center gap-2">
              <Share className="h-3.5 w-3.5 text-accent" /> Tap the Share button in Safari
            </li>
            <li className="flex items-center gap-2">
              <PlusSquare className="h-3.5 w-3.5 text-accent" /> Choose &ldquo;Add to Home Screen&rdquo;
            </li>
            <li className="flex items-center gap-2">
              <Download className="h-3.5 w-3.5 text-accent" /> Open it like any app — full screen
            </li>
          </ol>
        </>
      )}
    </div>
  );
}
