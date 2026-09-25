"use client";

import { useEffect, useRef } from "react";

const GREENS = ["#44602c", "#557a34", "#5c6844", "#6c8d3c", "#7fa04a", "#91b35a"];

type Blade = { x: number; y: number; len: number; width: number; lean: number; color: string; phase: number; bend: number; spin: number };

// A word overgrown with grass. A canvas draws the letters filled with a grass
// texture, with blades sprouting from their tops and baseline that sway in a
// light breeze and bend away from the pointer. The real text stays in the DOM
// (made transparent once the canvas has drawn) for screen readers and search.
export default function GrassWord({ children }: { children: string }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const probeRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const probe = probeRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !probe || !canvas || !ctx) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, lastX: 0, vx: 0, active: false };
    let blades: Blade[] = [];
    let letters: HTMLCanvasElement | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let reach = 30;
    let grow = still ? 1 : 0;
    let frame = 0;
    let onScreen = false;

    const layout = () => {
      const box = canvas.getBoundingClientRect();
      width = box.width;
      height = box.height;
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (!width || !height) return;
      const style = getComputedStyle(wrap);
      const left = wrap.getBoundingClientRect().left - box.left;
      const baseline = probe.getBoundingClientRect().top - box.top;
      let seed = 11; // same lawn on every visit
      const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

      // Draw the word once, then read its top edge column by column.
      letters = document.createElement("canvas");
      letters.width = canvas.width;
      letters.height = canvas.height;
      const l = letters.getContext("2d")!;
      l.scale(dpr, dpr);
      l.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      l.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
      l.fillText(children, left, baseline);
      const alpha = l.getImageData(0, 0, letters.width, letters.height).data;
      const inked = (x: number, y: number) => alpha[(Math.round(y * dpr) * letters!.width + Math.round(x * dpr)) * 4 + 3] > 110;
      const tops: number[] = [];
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) if (inked(x, y)) { tops[x] = y; break; }
      }
      const xHeight = baseline - Math.min(...tops.filter(Number.isFinite));
      if (!Number.isFinite(xHeight) || xHeight <= 0) return;
      reach = xHeight * 2;

      // Fill the letters with grass: a green ramp, then short streaks.
      l.globalCompositeOperation = "source-in";
      const ramp = l.createLinearGradient(0, baseline - xHeight, 0, baseline + xHeight * 0.4);
      ramp.addColorStop(0, "#86a84f");
      ramp.addColorStop(1, "#3f5829");
      l.fillStyle = ramp;
      l.fillRect(0, 0, width, height);
      l.globalCompositeOperation = "source-atop";
      l.lineWidth = 0.8;
      for (let i = 0; i < 320; i++) {
        const x = rand() * width;
        const y = rand() * height;
        l.globalAlpha = 0.35 + rand() * 0.4;
        l.strokeStyle = GREENS[i % GREENS.length];
        l.beginPath();
        l.moveTo(x, y);
        l.lineTo(x + (rand() - 0.5) * 2, y - 2 - rand() * 4);
        l.stroke();
      }

      // Blades: taller ones from the letter tops, then a short fringe in front.
      const blade = (x: number, y: number, len: number): Blade => ({
        x, y, len, width: 1.1 + rand() * 1.5, lean: (rand() - 0.5) * 0.55,
        color: GREENS[Math.floor(rand() * GREENS.length)], phase: rand() * 6.28, bend: 0, spin: 0,
      });
      const back: Blade[] = [];
      const front: Blade[] = [];
      for (let x = 0; x < width; x += 1 + rand() * 1.1) {
        const top = tops[Math.round(x)];
        if (top === undefined) continue;
        back.push(blade(x, top + rand() * xHeight * 0.35, xHeight * (0.55 + rand() * 0.75)));
        if (rand() < 0.55 && inked(x, baseline - 2)) front.push(blade(x, baseline + 1, xHeight * (0.3 + rand() * 0.35)));
      }
      blades = [...back.sort((a, b) => a.y - b.y), ...front];
      draw();
      wrap.classList.add("is-drawn");
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (letters) ctx.drawImage(letters, 0, 0, width, height);
      for (const b of blades) {
        const len = b.len * grow;
        const a = b.lean + b.bend;
        const tipX = b.x + Math.sin(a) * len;
        const tipY = b.y - Math.cos(a) * len;
        const midX = b.x + Math.sin(a * 0.45) * len * 0.55;
        const midY = b.y - Math.cos(a * 0.45) * len * 0.55;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(b.x - b.width / 2, b.y);
        ctx.quadraticCurveTo(midX - b.width / 4, midY, tipX, tipY);
        ctx.quadraticCurveTo(midX + b.width / 4, midY, b.x + b.width / 2, b.y);
        ctx.fill();
      }
    };

    const step = (now: number) => {
      const t = now / 1000;
      grow = Math.min(1, grow + 0.025);
      pointer.vx *= 0.85;
      for (const b of blades) {
        // a light breeze, plus a push away from the pointer
        let target = Math.sin(t * 1.4 + b.phase) * 0.05 + Math.sin(t * 0.6 + b.x * 0.04) * 0.04;
        if (pointer.active) {
          const a = b.lean + b.bend;
          const dx = b.x + Math.sin(a) * b.len * 0.6 - pointer.x;
          const d = Math.hypot(dx, b.y - b.len * 0.6 - pointer.y);
          if (d < reach) {
            const f = 1 - d / reach;
            target += Math.sign(dx || 1) * f * 1.1;
            b.spin += pointer.vx * f * 0.004;
          }
        }
        b.spin = (b.spin + (target - b.bend) * 0.09) * 0.84;
        b.bend += b.spin;
      }
      draw();
      frame = requestAnimationFrame(step);
    };

    const run = () => {
      cancelAnimationFrame(frame);
      frame = onScreen && !document.hidden && !still ? requestAnimationFrame(step) : 0;
    };
    const move = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = e.clientX - box.left;
      pointer.y = e.clientY - box.top;
      pointer.vx += pointer.active ? e.clientX - pointer.lastX : 0;
      pointer.lastX = e.clientX;
      pointer.active = true;
    };
    const leave = () => { pointer.active = false; };

    let alive = true;
    const resize = new ResizeObserver(() => layout());
    const seen = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; run(); });
    // Measure only once the heading font has loaded, or the blades miss the letters.
    document.fonts.ready.then(() => { if (!alive) return; layout(); resize.observe(wrap); seen.observe(wrap); });
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", run);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      resize.disconnect();
      seen.disconnect();
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", run);
    };
  }, [children]);

  return <span ref={wrapRef} className="grass-word">
    <span className="grass-text">{children}</span>
    <i ref={probeRef} className="grass-probe" aria-hidden="true" />
    <canvas ref={canvasRef} aria-hidden="true" />
  </span>;
}
