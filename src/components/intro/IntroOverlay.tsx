"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import HandScene from "./HandScene";
import Monogram from "@/components/layout/Monogram";
import { hasSeenIntro, markIntroSeen, useIntroMachine } from "./useIntroMachine";

const PHASE_CAPTION: Record<string, string> = {
  handshake: "Nice to meet you.",
  wave: "I'm Andrew.",
  fist: "",
  reveal: "AMC — Andrew Michael Coggins",
};

/**
 * First-visit intro. SSR renders the backdrop unconditionally (no hero
 * flash); a beforeInteractive script hides it via html[data-intro="seen"]
 * for returning visitors before paint, and this component confirms the
 * decision from localStorage on mount.
 *
 * The visual exit is animated during the machine's `exit` phase; the unmount
 * at `done` is unconditional (no AnimatePresence) so the overlay can never
 * wedge open in a throttled/background tab.
 */
export default function IntroOverlay() {
  // null = undecided (SSR/first render), then play or skip.
  const [play, setPlay] = useState<boolean | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    setPlay(!hasSeenIntro());
  }, []);

  if (play === null) {
    // Static backdrop while deciding — matches the SSR HTML.
    return <div className="intro-overlay fixed inset-0 z-50 bg-ink" aria-hidden />;
  }
  if (!play) return null;
  if (reduced) return <ReducedIntro />;
  return <AnimatedIntro />;
}

function AnimatedIntro() {
  // Don't start the sequence until the tab is actually visible — a visitor
  // opening the site in a background tab should get the intro when they
  // arrive, not a half-played corpse (hidden tabs freeze animation frames).
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (document.visibilityState === "visible") {
      setStarted(true);
      return;
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") setStarted(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const { phase, skip } = useIntroMachine(started);

  // Any interaction skips; the intro never holds the visitor hostage.
  useEffect(() => {
    if (phase === "done") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchmove", skip, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, skip]);

  // Lock scroll while the overlay is up.
  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <motion.div
      className="intro-overlay fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-ink"
      onClick={skip}
      initial={{ opacity: 1 }}
      animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        animate={phase === "exit" ? { scale: 0.6, y: -40, opacity: 0 } : { scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.45, 0.05, 0.35, 1] }}
      >
        <HandScene phase={phase} />
      </motion.div>
      <div className="mt-8 h-6">
        <AnimatePresence mode="wait">
          {PHASE_CAPTION[phase] && (
            <motion.p
              key={phase}
              className="mono-label text-copper"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {PHASE_CAPTION[phase]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <p className="absolute bottom-8 font-mono text-xs text-muted">
        click, scroll, or Esc to skip
      </p>
    </motion.div>
  );
}

/** prefers-reduced-motion: a quiet monogram fade, nothing moves. */
function ReducedIntro() {
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    markIntroSeen();
    const fadeAt = setTimeout(() => setFading(true), 1100);
    const doneAt = setTimeout(() => setDone(true), 1600);
    return () => {
      clearTimeout(fadeAt);
      clearTimeout(doneAt);
    };
  }, []);

  if (done) return null;

  return (
    <div
      className="intro-overlay fixed inset-0 z-50 flex items-center justify-center bg-ink transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1 }}
      onClick={() => setDone(true)}
    >
      <span className="text-copper">
        <Monogram size={72} strokeWidth={4} />
      </span>
    </div>
  );
}
