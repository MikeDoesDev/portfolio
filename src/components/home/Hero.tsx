"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { RESUME_PATH } from "@/lib/site";

const EASE = [0.21, 0.6, 0.35, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  const enter = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 32 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: EASE },
        };

  return (
    <section
      ref={ref}
      className="relative flex min-h-svh flex-col justify-center overflow-hidden pt-32 pb-20"
    >
      {/* faint copper trace, purely decorative */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/3 opacity-[0.07] lg:block"
        viewBox="0 0 400 800"
        fill="none"
        preserveAspectRatio="xMaxYMid slice"
      >
        <path
          d="M400 80 H260 L200 140 V340 L260 400 H400 M400 480 H240 L180 540 V700"
          stroke="#e8a33d"
          strokeWidth="2"
        />
        <circle cx="200" cy="240" r="6" stroke="#e8a33d" strokeWidth="2" />
        <circle cx="180" cy="620" r="6" stroke="#e8a33d" strokeWidth="2" />
      </svg>

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <motion.p className="mono-label" {...enter(0)}>
          Computer &amp; Electrical Engineering — Texas A&amp;M &rsquo;28
        </motion.p>

        <motion.div
          style={reduced ? undefined : { y: headlineY, opacity: headlineOpacity }}
        >
          <motion.h1
            className="mt-6 font-heading text-display font-bold uppercase leading-[0.92] tracking-tight"
            {...enter(0.1)}
          >
            <span className="block">Hardware</span>
            <span className="block">
              <span aria-hidden="true" className="text-copper">
                ×&nbsp;
              </span>
              Software
            </span>
          </motion.h1>
        </motion.div>

        <motion.p className="mt-8 max-w-xl text-lg text-muted" {...enter(0.25)}>
          I&rsquo;m Andrew Coggins. I design embedded systems and build agentic
          AI — and I ship both.
        </motion.p>

        <motion.div className="mt-10 flex flex-wrap items-center gap-4" {...enter(0.35)}>
          <a
            href="#work"
            className="group inline-flex items-center gap-2 rounded-full bg-copper px-6 py-3 font-mono text-sm uppercase tracking-[0.14em] text-ink transition-colors hover:bg-copper-bright"
          >
            See the work
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-y-0.5"
            >
              ↓
            </span>
          </a>
          <a
            href={RESUME_PATH}
            download
            className="inline-flex items-center rounded-full border border-line px-6 py-3 font-mono text-sm uppercase tracking-[0.14em] text-muted transition-colors hover:border-copper hover:text-copper"
          >
            Resume
          </a>
        </motion.div>
      </div>
    </section>
  );
}
