"use client";

import { useEffect, useId, useRef } from "react";

// Flat-top SVG honeycomb inspired by Magic UI's Hexagon Pattern.
// Reusable cells lift on approach and settle into the cream background.
const R = 38;
const H = Math.sqrt(3) * R;
const points = Array.from({ length: 6 }, (_, i) => {
  const angle = i * Math.PI / 3;
  return `${R * Math.cos(angle)},${R * Math.sin(angle)}`;
}).join(" ");

export default function HexagonBackground() {
  const id = useId();
  const field = useRef<SVGGElement>(null);

  useEffect(() => {
    const grid = field.current;
    if (!grid) return;
    const cells = Array.from(grid.querySelectorAll<SVGGElement>(".hexagon-cell"));
    let active: SVGGElement | undefined;
    let index = 0;
    let lastKey = "";
    let frame = 0;
    let idleTimer = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      const matrix = grid.getScreenCTM();
      if (!matrix) return;
      const local = new DOMPoint(x, y).matrixTransform(matrix.inverse());
      const column = Math.round(local.x / (R * 1.5));
      let nearest = { x: 0, y: 0, distance: Infinity };
      for (let col = column - 1; col <= column + 1; col++) {
        const offset = (Math.abs(col) % 2) * H / 2;
        const row = Math.round((local.y - offset) / H);
        const cx = col * R * 1.5;
        const cy = row * H + offset;
        const distance = Math.hypot(local.x - cx, local.y - cy);
        if (distance < nearest.distance) nearest = { x: cx, y: cy, distance };
      }
      const key = `${nearest.x},${nearest.y}`;
      if (key === lastKey) return;
      active?.classList.remove("is-hovered");
      active = cells.find(cell => cell.dataset.position === key) ?? cells[index++ % cells.length];
      active.dataset.position = key;
      active.setAttribute("transform", `translate(${nearest.x} ${nearest.y})`);
      active.classList.add("is-hovered");
      lastKey = key;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(leave, 300);
    };
    const leave = () => {
      window.clearTimeout(idleTimer);
      cancelAnimationFrame(frame);
      frame = 0;
      active?.classList.remove("is-hovered");
      lastKey = "";
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      window.clearTimeout(idleTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, []);

  return <svg className="hexagon-background" aria-hidden="true" focusable="false">
    <defs>
      <pattern id={id} width={R * 3} height={H} patternUnits="userSpaceOnUse">
        <g className="hexagon-lines">
          {[[0, 0], [R * 3, 0], [0, H], [R * 3, H], [R * 1.5, H / 2]].map(([x, y]) =>
            <polygon key={`${x}-${y}`} points={points} transform={`translate(${x} ${y})`} />)}
        </g>
      </pattern>
    </defs>
    <g ref={field} transform="rotate(-8)">
      <rect x="-10000" y="-10000" width="20000" height="20000" fill={`url(#${id})`} />
      {Array.from({ length: 24 }, (_, i) => <g key={i} className="hexagon-cell">
        <polygon className="hexagon-highlight" points={points} />
      </g>)}
    </g>
  </svg>;
}
