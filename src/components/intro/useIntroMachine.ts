"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type IntroPhase = "handshake" | "wave" | "fist" | "reveal" | "exit" | "done";

const SEEN_KEY = "amc-intro-seen";

/** Per-phase dwell in ms (exit is driven by its own animation completion). */
const PHASE_MS: Partial<Record<IntroPhase, number>> = {
  handshake: 1500,
  wave: 1500,
  fist: 900,
  reveal: 2000,
};

const ORDER: IntroPhase[] = ["handshake", "wave", "fist", "reveal", "exit"];

export function markIntroSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage unavailable — intro will just replay next visit */
  }
}

export function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Linear intro sequence: handshake → wave → fist → reveal → exit → done.
 * skip() jumps straight to exit from any phase; the flag is persisted the
 * moment exit begins so an abandoned tab still counts as seen.
 */
export function useIntroMachine(active: boolean) {
  const [phase, setPhase] = useState<IntroPhase>("handshake");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback((to: IntroPhase) => {
    if (timer.current) clearTimeout(timer.current);
    setPhase((current) => {
      if (current === "done" || current === "exit") return current;
      if (to === "exit") markIntroSeen();
      return to;
    });
  }, []);

  const skip = useCallback(() => advance("exit"), [advance]);

  const finish = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("done");
  }, []);

  useEffect(() => {
    if (!active || phase === "done") return;
    // Exit phase: hard deadline so the overlay can never wedge open if the
    // exit animation's completion callback stalls (throttled/background tab).
    if (phase === "exit") {
      timer.current = setTimeout(() => setPhase("done"), 800);
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }
    const ms = PHASE_MS[phase];
    if (!ms) return;
    timer.current = setTimeout(() => {
      const next = ORDER[ORDER.indexOf(phase) + 1];
      if (next === "exit") markIntroSeen();
      setPhase(next);
    }, ms);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active, phase]);

  return { phase, skip, finish };
}
