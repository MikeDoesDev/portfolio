"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

/* ────────────────────────── icons ────────────────────────── */

const ICONS = {
  github: (
    <path
      fill="currentColor"
      d="M12 2C6.5 2 2 6.6 2 12.3c0 4.5 2.9 8.4 6.8 9.7.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.3 10.3 0 0 0 22 12.3C22 6.6 17.5 2 12 2z"
    />
  ),
  linkedin: (
    <path
      fill="currentColor"
      d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3.2 9h3.6v12H3.2zM9.3 9h3.45v1.65h.05c.5-.92 1.75-1.9 3.6-1.9 3.85 0 4.6 2.4 4.6 5.5V21h-3.6v-5.5c0-1.3-.03-3-1.9-3s-2.2 1.44-2.2 2.92V21H9.3z"
    />
  ),
  instagram: (
    <g fill="none" stroke="url(#orbit-ig-grad)" strokeWidth="1.9">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="url(#orbit-ig-grad)" stroke="none" />
    </g>
  ),
  // Handshake: lime tile with the italic H. Colours sampled from the official
  // mark (#D2F94B / #06303A); the letterform is traced by eye — swap in the
  // official SVG if they publish one.
  handshake: (
    <g>
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#D2F94B" />
      <path
        fill="#06303A"
        d="M8.3 4.6h3.1l-1 6.2 3.3-2.3.6-3.9h3.1l-2.2 14.8h-3.1l1-6.4-3.3 2.3-.6 4.1H5.9z"
      />
    </g>
  ),
  email: (
    <g>
      <path fill="#FFFFFF" d="M0 6.9h24v11.3a1.6 1.6 0 0 1-1.6 1.6H1.6A1.6 1.6 0 0 1 0 18.2z" />
      <path fill="#4285F4" d="M1.6 19.8h3.9V11L0 6.9v11.3c0 .9.7 1.6 1.6 1.6z" />
      <path fill="#34A853" d="M18.5 19.8h3.9c.9 0 1.6-.7 1.6-1.6V6.9L18.5 11z" />
      <path fill="#FBBC04" d="M18.5 5.2V11L24 6.9V5.5c0-2-2.3-3.2-3.9-2z" />
      <path fill="#EA4335" d="M5.5 11V5.2L12 10l6.5-4.8V11L12 15.8z" />
      <path fill="#C5221F" d="M0 5.5v1.4L5.5 11V5.2L3.9 3.5C2.3 2.3 0 3.5 0 5.5z" />
    </g>
  ),
  resume: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.2 2.8h7.1l4.5 4.5v13.9H6.2z" />
      <path d="M13.3 2.8v4.5h4.5M9.4 13h5.2M9.4 16.6h5.2" />
    </g>
  ),
} as const;

export type OrbitIcon = keyof typeof ICONS;

/** Brand colour per mark. Real brand marks get their own colour; utility links
 *  (email, résumé) take the site accent so they read as ours, not a third party's.
 *  Defined in globals.css so a light-ground theme only has to flip one place. */
const TONE: Record<OrbitIcon, string> = {
  github: "orbit-ic-github",
  linkedin: "orbit-ic-linkedin",
  instagram: "", // gradient
  handshake: "", // full-colour tile
  email: "", // Gmail's own palette
  resume: "orbit-ic-util", // no brand of its own — takes the site accent
};

export interface OrbitLink {
  label: string;
  href: string;
  icon: OrbitIcon;
  /** Opens in a new tab with rel="noreferrer". */
  external?: boolean;
}

interface OrbitClusterProps {
  links: OrbitLink[];
  /** Path under /public. Falls back to a silhouette placeholder when absent. */
  photoSrc?: string;
  photoAlt?: string;
  /** Ring radius in px. */
  radius?: number;
  /** Degrees per second when the cursor is far away. */
  fullSpeed?: number;
  /** Cursor distance from centre (px) inside which the ring is fully stopped. */
  calmRadius?: number;
  /** Px of approach over which speed ramps from stopped to full. */
  runway?: number;
  /** Damping exponent. Higher makes the calm zone feel wider. */
  curve?: number;
  /**
   * Fraction by which each node's distance from centre varies (0 = a perfect
   * circle). A little variance stops the ring reading as a fixed track once
   * the guide circle is gone. Deterministic per index, never random — a random
   * value would differ between server and client render.
   */
  scatter?: number;
  className?: string;
}

/**
 * Social links orbiting a portrait, slowing to a stop as the cursor approaches.
 *
 * One rAF loop writes a single `--orbit` custom property; each node derives its
 * own transform from it in CSS, so cost is constant regardless of link count.
 *
 * Motion is suppressed entirely when the user prefers reduced motion, when the
 * device has no hover-capable pointer, and while a node holds keyboard focus —
 * a moving click target is the usual failure mode of this pattern.
 */
export default function OrbitCluster({
  links,
  photoSrc,
  photoAlt = "Portrait",
  radius = 122,
  fullSpeed = 12,
  calmRadius = 80,
  runway = 20,
  curve = 1,
  scatter = 0.1,
  className = "",
}: OrbitClusterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = ref.current;
    if (!host || reduced) return;

    // No pointer to approach with means the damping has no input at all.
    if (window.matchMedia("(hover: none)").matches) return;

    let angle = 0;
    let speed = 0;
    let last = 0;
    let visible = true;
    let frame = 0;
    const cursor = { x: -1e6, y: -1e6 };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    };
    const onLeave = () => {
      cursor.x = -1e6;
      cursor.y = -1e6;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(host);

    const tick = (now: number) => {
      if (!last) last = now;
      const dt = Math.min(64, now - last) / 1000;
      last = now;

      const box = host.getBoundingClientRect();
      const dist = Math.hypot(
        cursor.x - (box.left + box.width / 2),
        cursor.y - (box.top + box.height / 2),
      );

      const t = Math.min(1, Math.max(0, (dist - calmRadius) / Math.max(1, runway)));
      const held = host.contains(document.activeElement);
      const target = held || !visible ? 0 : fullSpeed * Math.pow(t, curve);

      // Lerp the speed rather than the angle: the ring winds down as you
      // approach instead of freezing, which otherwise reads as a bug.
      speed += (target - speed) * 0.08;
      angle = (angle + speed * dt) % 360;
      host.style.setProperty("--orbit", angle.toFixed(2));

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      io.disconnect();
    };
  }, [reduced, fullSpeed, calmRadius, runway, curve]);

  const step = 360 / Math.max(1, links.length);

  return (
    <div
      ref={ref}
      className={`orbit-cluster relative shrink-0 ${className}`}
      // Shrinks on narrow viewports without scaling the 46px nodes below the
      // minimum touch target. Box size derives from this in globals.css.
      style={{ ["--orbit-r"]: `clamp(96px, 26vw, ${radius}px)` } as CSSProperties}
    >
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <linearGradient id="orbit-ig-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FDCB5C" />
          <stop offset="30%" stopColor="#F7803C" />
          <stop offset="60%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#8134AF" />
        </linearGradient>
      </svg>

      <div className="absolute left-1/2 top-1/2 size-[136px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-raised">
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoSrc} alt={photoAlt} width={272} height={272} className="size-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" className="size-full p-8 text-muted/50" aria-label="Portrait placeholder" role="img">
            <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <circle cx="12" cy="8.6" r="4.1" />
              <path d="M3.9 21.2c0-4.3 3.7-6.9 8.1-6.9s8.1 2.6 8.1 6.9" />
            </g>
          </svg>
        )}
      </div>

      {links.map((link, i) => (
        <a
          key={link.label}
          href={link.href}
          aria-label={link.label}
          {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
          className="orbit-node absolute left-1/2 top-1/2 -ml-[23px] -mt-[23px] grid size-[46px] place-items-center rounded-full border border-line bg-surface focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-copper"
          style={
            {
              ["--a"]: String(-90 + i * step),
              ["--rf"]: (1 + Math.sin(i * 2.399) * scatter).toFixed(3),
            } as CSSProperties
          }
        >
          <svg viewBox="0 0 24 24" className={`size-5 ${TONE[link.icon]}`} aria-hidden="true">
            {ICONS[link.icon]}
          </svg>
        </a>
      ))}
    </div>
  );
}
