"use client";

import { useEffect, useRef } from "react";

// Drifting sage nodes on the cream ground. Nearby nodes link with faint
// lines; the pointer acts as one more node and gently pulls its neighbours.
// With `page`, nodes are spread over the whole document and scroll away with
// the content; otherwise the canvas fills its positioned parent.
const SAGE = "92, 104, 68"; // --color-copper (#5c6844) as rgb
const LINK = 130;
const POINTER_LINK = 170;
const SPEED = 0.12;
const AREA_PER_NODE = 16000;
const EDGE = 10; // nodes wrap this far past the edges

type Node = { x: number; y: number; vx: number; vy: number; r: number };

export default function NodeGraphBackground({ page = false }: { page?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let nodes: Node[] = [];
    let width = 0;
    let height = 0;
    let worldWidth = 0;
    let worldHeight = 0;
    let dpr = 1;
    let frame = 0;
    const pointer = { clientX: 0, clientY: 0, x: 0, y: 0, strength: 0, active: false };
    const scrollTop = () => (page ? window.scrollY : 0);

    const scatter = (x0: number, y0: number, x1: number, y1: number) => {
      const count = Math.round(((x1 - x0) * (y1 - y0)) / AREA_PER_NODE);
      for (let i = 0; i < count; i++) nodes.push({
        x: x0 + Math.random() * (x1 - x0),
        y: y0 + Math.random() * (y1 - y0),
        vx: (Math.random() - 0.5) * SPEED * 2,
        vy: (Math.random() - 0.5) * SPEED * 2,
        r: 1.1 + Math.random() * 1.3,
      });
    };

    const draw = () => {
      const top = scrollTop();
      ctx.setTransform(dpr, 0, 0, dpr, 0, -top * dpr);
      ctx.clearRect(0, top, width, height);
      const shown = nodes.filter(n => n.y > top - POINTER_LINK && n.y < top + height + POINTER_LINK);
      ctx.fillStyle = `rgba(${SAGE}, 0.34)`;
      for (let i = 0; i < shown.length; i++) {
        const a = shown[i];
        for (let j = i + 1; j < shown.length; j++) {
          const b = shown[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > LINK) continue;
          ctx.strokeStyle = `rgba(${SAGE}, ${(1 - d / LINK) * 0.2})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        if (pointer.strength > 0.01) {
          const d = Math.hypot(a.x - pointer.x, a.y - pointer.y);
          if (d < POINTER_LINK) {
            ctx.strokeStyle = `rgba(${SAGE}, ${(1 - d / POINTER_LINK) * 0.32 * pointer.strength})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Fit the canvas, then trim or extend the node field to the new area so
    // switching pages or opening a section never reshuffles what is on screen.
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      width = box.width;
      height = box.height;
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const w = width;
      const h = page ? document.documentElement.scrollHeight : height;
      nodes = nodes.filter(n => n.x < w + EDGE && n.y < h + EDGE);
      if (w > worldWidth) scatter(worldWidth, 0, w, Math.min(h, worldHeight));
      if (h > worldHeight) scatter(0, worldHeight, w, h);
      worldWidth = w;
      worldHeight = h;
      draw();
    };

    const step = () => {
      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.06;
      if (pointer.strength > 0.01) {
        const box = canvas.getBoundingClientRect();
        pointer.x = pointer.clientX - box.left;
        pointer.y = pointer.clientY - box.top + scrollTop();
      }
      for (const n of nodes) {
        if (pointer.strength > 0.01) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const d = Math.hypot(dx, dy);
          if (d < POINTER_LINK && d > 1) {
            const pull = (1 - d / POINTER_LINK) * 0.0004 * pointer.strength;
            n.vx += dx * pull;
            n.vy += dy * pull;
          }
        }
        // ease back toward cruising speed so the pull never snowballs
        const v = Math.hypot(n.vx, n.vy) || 1;
        const k = 1 + (SPEED / v - 1) * 0.02;
        n.vx *= k;
        n.vy *= k;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -EDGE) n.x = worldWidth + EDGE;
        if (n.x > worldWidth + EDGE) n.x = -EDGE;
        if (n.y < -EDGE) n.y = worldHeight + EDGE;
        if (n.y > worldHeight + EDGE) n.y = -EDGE;
      }
      draw();
      frame = requestAnimationFrame(step);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      pointer.active = true;
    };
    const leave = () => { pointer.active = false; };
    const visibility = () => {
      cancelAnimationFrame(frame);
      frame = !document.hidden && !still ? requestAnimationFrame(step) : 0;
    };

    // the canvas tracks the viewport; the body tracks the page's length
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (page) observer.observe(document.body);
    resize();
    visibility();
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", visibility);
    // reduced motion has no loop, so repaint the still field on scroll
    if (still && page) window.addEventListener("scroll", draw, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("scroll", draw);
    };
  }, [page]);

  return <canvas
    ref={canvasRef}
    aria-hidden="true"
    style={{ position: page ? "fixed" : "absolute", inset: 0, width: "100%", height: "100%", zIndex: -1, pointerEvents: "none" }}
  />;
}
