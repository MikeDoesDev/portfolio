export type ProjectStatus = "shipped" | "in-progress" | "planning" | "considering";
export interface Project {
  slug: string; title: string; tagline: string; blurb: string; tags: string[];
  status: ProjectStatus; timeframe: string; group: "featured" | "ongoing" | "study";
  media?: { src: string; alt: string; width: number; height: number; caption: string };
  links?: { label: string; href: string; external: boolean }[];
}
export const PROJECTS: Project[] = [
  {
    slug: "schedule-optimizer", title: "TAMU Schedule Optimizer", tagline: "A better way to compare class schedules",
    blurb: "I built a tool to compare conflict-free schedules using professor ratings, grade history, and the times I actually want to be in class.",
    tags: ["Python", "Flask", "Data pipelines"], status: "shipped", timeframe: "2026", group: "featured",
    media: { src: "/media/projects/scheduler.webp", alt: "Schedule demo with preference controls and ranked class combinations", width: 1280, height: 720, caption: "Interactive demo with sample course data" },
    links: [{ label: "Try the demo", href: "/projects/schedule-optimizer#demo", external: false }],
  },
  {
    slug: "single-cycle-processor", title: "Single-cycle LEGv8 processor", tagline: "Following an instruction through a 64-bit datapath",
    blurb: "A course processor implementation in Verilog. I completed the control and datapath integration, then added MOVZ to construct and store a 64-bit constant.",
    tags: ["Verilog", "Computer architecture", "Simulation"], status: "shipped", timeframe: "Summer 2026", group: "featured",
    media: { src: "/media/projects/processor.png", alt: "The datapath explorer mid-program, with the wires the current instruction uses lit up", width: 1280, height: 720, caption: "Replaying the recorded simulation · course project" },
    links: [{ label: "Step through it", href: "/projects/single-cycle-processor#explorer", external: false }],
  },
  {
    slug: "games", title: "Games suite", tagline: "Card games I first wrote in Python and C++, rebuilt for the browser",
    blurb: "Blackjack and Crazy 8s, playable here, with simulations that pit strategies against each other and check the results against published figures.",
    tags: ["TypeScript", "Simulation", "Testing"], status: "shipped", timeframe: "2024–2026", group: "featured",
    media: { src: "/media/projects/games.png", alt: "A blackjack hand in play, with the basic-strategy coach suggesting a move", width: 1280, height: 720, caption: "Playable in the browser" },
    links: [{ label: "Play the games", href: "/projects/games#play", external: false }],
  },
  {
    slug: "raspberry-pi-3d", title: "Raspberry Pi 5 visualizer", tagline: "Get to know the board, one component at a time",
    blurb: "A browser-based 3D board built with procedural geometry. Rotate it, inspect 23 components, and switch to a wireframe view.",
    tags: ["Three.js", "WebGL", "Hardware"], status: "shipped", timeframe: "2026", group: "featured",
    media: { src: "/media/projects/pi-visualizer.webp", alt: "Interactive green Raspberry Pi board beside its component list", width: 1280, height: 720, caption: "The working browser visualizer" },
    links: [{ label: "Explore the board", href: "/demos/raspberry-pi-3d/index.html", external: true }],
  },
  {
    slug: "image-processing", title: "Image scaling and stitching", tagline: "Resizing images and stitching panoramas, first in C++",
    blurb: "Bicubic image scaling and a panorama stitcher that finds corners, matches them, and warps one photo onto another. The browser demos reproduce the C++ output byte for byte.",
    tags: ["C++", "Computer vision", "TypeScript"], status: "in-progress", timeframe: "Course project", group: "ongoing",
    links: [{ label: "Try the demos", href: "/projects/image-processing#demo", external: false }],
  },
  {
    slug: "alfred", title: "ALFRED", tagline: "Calendar, email, habits, and chat in one place",
    blurb: "A personal dashboard I’m building to bring my calendar, inbox, habits, and Claude conversations together.",
    tags: ["Next.js", "TypeScript", "Claude API"], status: "in-progress", timeframe: "2026–present", group: "ongoing",
  },
  {
    slug: "wit", title: "WIT", tagline: "A habit tracker with room for rest days",
    blurb: "A working prototype that tracks scheduled habits, awards XP, and treats a planned rest day differently from a missed habit.",
    tags: ["JavaScript", "Canvas", "Local storage"], status: "in-progress", timeframe: "2026–present", group: "ongoing",
    media: { src: "/media/projects/wit.webp", alt: "WIT habit dashboard showing seeded example history", width: 1280, height: 720, caption: "Prototype with seeded example history" },
    links: [{ label: "Open prototype", href: "/demos/wit/index.html#system", external: true }],
  },
  {
    slug: "gladiator-dash", title: "Gladiator Dash timing", tagline: "An RFID timing design for One Army’s charity race",
    blurb: "A paused design study exploring RFID readers, read zones, and an offline results pipeline. No race has been timed with this system.",
    tags: ["RFID", "System design"], status: "considering", timeframe: "2026", group: "study",
  },
];
export function getProject(slug: string): Project {
  const project = PROJECTS.find(entry => entry.slug === slug);
  if (!project) throw new Error(`Unknown project slug: ${slug}`);
  return project;
}
export function nextProject(slug: string): Project {
  const index = PROJECTS.findIndex(entry => entry.slug === slug);
  if (index < 0) throw new Error(`Unknown project slug: ${slug}`);
  return PROJECTS[(index + 1) % PROJECTS.length];
}
export const STATUS_LABEL: Record<ProjectStatus, string> = { shipped: "Working project", "in-progress": "In progress", planning: "Design study", considering: "Design study · paused" };
