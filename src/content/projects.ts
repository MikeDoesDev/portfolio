export type ProjectStatus = "shipped" | "in-progress" | "planning";

export interface Project {
  slug: string;
  title: string;
  /** Short line under the title on cards and page heroes. */
  tagline: string;
  /** 1-2 sentence card blurb. */
  blurb: string;
  tags: string[];
  status: ProjectStatus;
  /** Human-readable timeframe shown in the meta row. */
  timeframe: string;
  /** Headliners render first and larger on the home grid. */
  headliner: boolean;
  /** Optional external links rendered in the meta row. */
  links?: { label: string; href: string; external: boolean }[];
}

export const PROJECTS: Project[] = [
  {
    slug: "alfred",
    title: "ALFRED",
    tagline: "A personal AI command center",
    blurb:
      "A Jarvis-style dashboard unifying calendar, email, habits, and a streaming Claude chat that knows my goals — one screen that runs the day.",
    tags: ["Next.js", "TypeScript", "Claude API", "Google Calendar", "Gmail API", "Tailwind"],
    status: "in-progress",
    timeframe: "2026 — present",
    headliner: true,
  },
  {
    slug: "schedule-optimizer",
    title: "TAMU Schedule Optimizer",
    tagline: "Every conflict-free schedule, scored",
    blurb:
      "Pulls 21k+ Texas A&M course sections, enriches them with professor ratings and real grade distributions, and ranks every possible schedule against my personal weights.",
    tags: ["Python", "Flask", "GraphQL", "Data pipelines"],
    status: "shipped",
    timeframe: "2026",
    headliner: true,
  },
  {
    slug: "gladiator-dash",
    title: "Gladiator Dash RFID Timing",
    tagline: "Race timing, built instead of rented",
    blurb:
      "An embedded RFID timing system — Raspberry Pi, industrial reader, tuned antennas — architected to time hundreds of mud-run racers and replace a $3K/year vendor.",
    tags: ["Raspberry Pi", "RFID / LLRP", "Embedded", "SQLite", "FastAPI"],
    status: "planning",
    timeframe: "2025 — present",
    headliner: true,
  },
  {
    slug: "raspberry-pi-3d",
    title: "Raspberry Pi 5 — 3D Blueprint",
    tagline: "A single-board computer you can explore",
    blurb:
      "An interactive 3D Raspberry Pi 5 built from procedural geometry — orbit the board, toggle blueprint mode, and click any of 23 components to learn what it does.",
    tags: ["Three.js", "WebGL", "Hardware"],
    status: "shipped",
    timeframe: "2026",
    headliner: false,
  },
  {
    slug: "wit",
    title: "WIT — The Life Game",
    tagline: "Whatever It Takes, gamified",
    blurb:
      "A habit tracker that plays like a game: XP, six ranks, streak shields, and a 12-week consistency heatmap across four life categories — validated with 53 passing self-tests.",
    tags: ["JavaScript", "Canvas", "Product design"],
    status: "shipped",
    timeframe: "2026",
    headliner: false,
  },
];

export function getProject(slug: string): Project {
  const p = PROJECTS.find((p) => p.slug === slug);
  if (!p) throw new Error(`Unknown project slug: ${slug}`);
  return p;
}

export function nextProject(slug: string): Project {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  return PROJECTS[(i + 1) % PROJECTS.length];
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  shipped: "Shipped",
  "in-progress": "In progress",
  planning: "Architecture phase",
};
