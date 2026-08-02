"use client";

import { useEffect, useState } from "react";

/**
 * Bottom inset occupied by the on-screen keyboard (visualViewport).
 * Use as `style={{ bottom: inset }}` on fixed bottom sheets so they sit above the keyboard.
 */
export function useKeyboardInset(enabled = true) {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // Layout viewport below the visual viewport ≈ keyboard (and browser chrome).
      const covered = Math.max(
        0,
        Math.round(window.innerHeight - vv.height - vv.offsetTop)
      );
      setInset(covered);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled]);

  return inset;
}
