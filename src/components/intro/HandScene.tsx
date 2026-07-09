"use client";

import { motion } from "motion/react";
import type { IntroPhase } from "./useIntroMachine";

const WRIST = "120px 214px";
const EASE = [0.45, 0.05, 0.35, 1] as const;

/**
 * Minimal line-art hand, copper stroke on ink. Three poses live in one SVG as
 * separate groups sharing the same wrist point; poses crossfade (reads as a
 * morph) while the active pose carries the phase's motion.
 */
export default function HandScene({ phase }: { phase: IntroPhase }) {
  const showProfile = phase === "handshake";
  const showPalm = phase === "wave" || phase === "reveal";
  const showFist = phase === "fist";
  const revealing = phase === "reveal";

  return (
    <svg
      viewBox="0 0 240 240"
      className="h-[min(52vw,20rem)] w-[min(52vw,20rem)] text-copper"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Handshake — flat hand in profile, offered forward */}
      <motion.g
        className="pose-profile"
        strokeWidth={11}
        initial={{ opacity: 1 }}
        animate={
          showProfile
            ? { opacity: 1, y: [0, 9, -2, 9, 0] }
            : { opacity: 0 }
        }
        transition={{
          opacity: { duration: 0.3 },
          y: { duration: 1.35, ease: EASE, times: [0, 0.3, 0.5, 0.75, 1] },
        }}
      >
        {/* back of hand + fingers pointing right */}
        <path d="M40 158 L112 158 M148 154 L196 160 Q208 164 202 174 Q198 182 186 182 L44 186" strokeWidth={10} />
        {/* thumb rising from the knuckle line */}
        <path d="M112 158 Q118 132 140 134 Q152 136 148 150" strokeWidth={9} />
        {/* wrist */}
        <path d="M40 148 L36 196" strokeWidth={9} />
      </motion.g>

      {/* Open palm — used for the wave and the reveal */}
      <motion.g
        className="pose-palm"
        initial={{ opacity: 0 }}
        style={{ transformOrigin: WRIST }}
        animate={
          showPalm
            ? {
                opacity: revealing ? 0.14 : 1,
                rotate: phase === "wave" ? [0, 20, -14, 20, -10, 0] : 0,
                scale: revealing ? 1.16 : 1,
              }
            : { opacity: 0, rotate: 0, scale: 0.96 }
        }
        transition={{
          opacity: { duration: 0.5 },
          rotate: { duration: 1.4, ease: "easeInOut" },
          scale: { duration: 0.7 },
        }}
      >
        {/* palm */}
        <path d="M82 150 L82 204 Q120 224 158 204 L158 150" strokeWidth={10} />
        {/* fingers */}
        <path d="M88 144 L86 100" strokeWidth={10} />
        <path d="M110 142 L110 88" strokeWidth={10} />
        <path d="M132 142 L133 94" strokeWidth={10} />
        <path d="M153 146 L156 110" strokeWidth={10} />
        {/* thumb */}
        <path d="M80 170 Q58 158 52 138" strokeWidth={10} />
      </motion.g>

      {/* Closed fist */}
      <motion.g
        className="pose-fist"
        strokeWidth={10}
        initial={{ opacity: 0 }}
        style={{ transformOrigin: WRIST }}
        animate={showFist ? { opacity: 1, scale: [0.97, 1.03, 1] } : { opacity: 0 }}
        transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.5 } }}
      >
        {/* fist body */}
        <path d="M82 150 L82 204 Q120 224 158 204 L158 150" />
        {/* curled knuckles */}
        <path d="M88 148 L88 128" />
        <path d="M110 146 L110 124" />
        <path d="M132 146 L132 126" />
        <path d="M153 148 L153 132" />
        {/* thumb wrapped across */}
        <path d="M84 176 Q112 190 140 178" strokeWidth={9} />
      </motion.g>

      {/* AMC monogram drawing on inside the open palm */}
      <motion.g
        className="pose-monogram"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealing ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.path
          d="M8 56 L26 8 L44 56 M16 38 L36 38 M56 56 L56 8 L74 34 L92 8 L92 56 M156 16 A22 22 0 1 0 156 48"
          transform="translate(30, 88) scale(1.07)"
          strokeWidth={6}
          className="text-copper-bright"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: revealing ? 1 : 0 }}
          transition={{ duration: 1.25, ease: "easeInOut", delay: revealing ? 0.3 : 0 }}
        />
      </motion.g>
    </svg>
  );
}
