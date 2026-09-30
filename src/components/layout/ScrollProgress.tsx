"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

// Scroll progress along the bottom of the sticky header, with a Dalmatian at
// its front. One CSS variable, --p, carries the progress; the bar's width and
// the dog's position both derive from it in globals.css. The dog runs only
// while the page is moving and faces the way it is going.
const STOP_MS = 160;

// Outline pass, then white fill pass of the same shapes, so the outline hugs
// the merged silhouette instead of crossing where body, neck and head meet.
const SILHOUETTE = (
  <>
    <path d="M10.5 14.5C11 11.5 17 10.8 23 11c4 .1 7-.6 9 .2 3.5 1.4 4.2 6 1.5 8.4-3 1.8-7.5 1-11.5.8s-8.5.8-10.8-1.2c-1.6-1.4-1.4-3.2-.7-4.7z" />
    <path d="M29.5 13c1-3.5 3-6.2 6-7.4l4.3 3.6c-1.6 2.6-2.8 5.4-4.2 8.2z" />
    <ellipse cx="38.2" cy="7.2" rx="4.3" ry="3.9" />
    <path d="M40 5.8c2.5-.2 5.8.6 6.6 2.2.6 1.4-.6 2.8-2.6 3-2 .2-3.6-.2-4.6-1z" />
  </>
);

// Legs pivot at the shoulder or hip. Diagonal pairs move together (a trot):
// near front with far back, and far front with near back half a stride later.
const LEGS = {
  farFront: { d: "M29.8 16.5l.4 12.1 1.6 1", pivot: "29.8px 16.5px", alt: true },
  farBack: { d: "M15.8 16.5c1.5 3.5 2.4 6 1.2 8.5l-.8 3.6 1.6 1", pivot: "15.8px 16.5px", alt: false },
  nearFront: { d: "M31.5 16.5l.5 12.1 1.6 1", pivot: "31.5px 16.5px", alt: false },
  nearBack: { d: "M14 16.5c1.5 3.5 2.4 6 1.2 8.5l-.8 3.6 1.6 1", pivot: "14px 16.5px", alt: true },
};

function Leg({ leg, far = false }: { leg: (typeof LEGS)[keyof typeof LEGS]; far?: boolean }) {
  return (
    <g className={leg.alt ? "dog-leg dog-alt" : "dog-leg"} style={{ transformOrigin: leg.pivot }}>
      <path d={leg.d} stroke="currentColor" strokeWidth={3.6} />
      <path d={leg.d} stroke={far ? "#e7e0d4" : "#fff"} strokeWidth={2.1} />
    </g>
  );
}

function Dalmatian() {
  return (
    <svg className="scroll-dog" viewBox="0 0 48 32">
      <g className="dog-bob">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Leg leg={LEGS.farFront} far />
          <Leg leg={LEGS.farBack} far />
          <g className="dog-tail" style={{ transformOrigin: "11px 14px" }}>
            <path d="M11 14.2C7.8 13 5.2 10.6 3.6 6.8" stroke="currentColor" strokeWidth={3} />
            <path d="M11 14.2C7.8 13 5.2 10.6 3.6 6.8" stroke="#fff" strokeWidth={1.6} />
          </g>
        </g>
        <g fill="currentColor" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round">{SILHOUETTE}</g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Leg leg={LEGS.nearFront} />
          <Leg leg={LEGS.nearBack} />
        </g>
        <g fill="#fff">{SILHOUETTE}</g>
        <g fill="currentColor">
          <circle cx="14.5" cy="13.2" r="1.3" />
          <circle cx="18.8" cy="16.8" r="1.1" />
          <circle cx="23.2" cy="13" r="1.25" />
          <circle cx="26.8" cy="17.6" r=".9" />
          <circle cx="29.6" cy="12.9" r=".95" />
          <circle cx="12.2" cy="17.6" r=".8" />
          <circle cx="21" cy="19.3" r=".6" />
          <circle cx="39.4" cy="4.4" r=".55" />
          <circle cx="40.3" cy="6.3" r=".75" />
          <circle cx="46.4" cy="7.9" r="1.1" />
        </g>
        <path d="M42.4 10.6c.2 1.8 1.6 2 1.9.3z" fill="#e8818a" />
        {/* Aggie maroon collar, the same #500000 as College Station on the travel map. */}
        <path d="M33.3 8.2l5.4 3.6" stroke="#500000" strokeWidth={1.7} strokeLinecap="round" />
        <path className="dog-ear" style={{ transformOrigin: "35.8px 4.6px" }} d="M35.6 4.2c-2 .4-2.7 3.4-1.9 6.2.9.8 2.6-.6 3.3-3.2.2-1.4-.4-2.7-1.4-3z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  const stop = useRef(0);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", value => {
    const el = ref.current;
    // Rubber-band scrolling can overshoot either end; keep the bar and dog on screen.
    const p = Math.min(1, Math.max(0, value));
    if (!el || p === last.current) return;
    el.dataset.dir = p > last.current ? "right" : "left";
    last.current = p;
    el.style.setProperty("--p", p.toFixed(4));
    el.dataset.running = "";
    window.clearTimeout(stop.current);
    stop.current = window.setTimeout(() => delete el.dataset.running, STOP_MS);
  });

  useEffect(() => () => window.clearTimeout(stop.current), []);

  return (
    <div ref={ref} className="scroll-progress" aria-hidden="true" data-dir="right">
      <div className="scroll-progress-bar" />
      <div className="scroll-progress-runner">
        <Dalmatian />
      </div>
    </div>
  );
}
