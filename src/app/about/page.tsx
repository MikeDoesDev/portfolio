import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import OrbitCluster from "@/components/about/OrbitCluster";
import type { OrbitLink } from "@/components/about/OrbitCluster";
import StackSplit from "@/components/about/StackSplit";
import {
  EMAIL,
  GITHUB_URL,
  HANDSHAKE_URL,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  RESUME_PATH,
  SITE_NAME,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "About — Andrew Michael Coggins",
  description:
    "Computer & Electrical Engineering at Texas A&M, Class of 2028. Embedded systems and agentic AI.",
};

const ALL_LINKS: OrbitLink[] = [
  { label: "GitHub", href: GITHUB_URL, icon: "github", external: true },
  { label: "LinkedIn", href: LINKEDIN_URL, icon: "linkedin", external: true },
  { label: "Handshake", href: HANDSHAKE_URL, icon: "handshake", external: true },
  { label: "Instagram", href: INSTAGRAM_URL, icon: "instagram", external: true },
  { label: "Email", href: `mailto:${EMAIL}`, icon: "email" },
  { label: "Résumé PDF", href: RESUME_PATH, icon: "resume" },
];

/** Handshake and Instagram stay out of the ring until their URLs are set. */
const LINKS = ALL_LINKS.filter((link) => link.href.length > 0);

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
      {/* ── portrait + orbit ───────────────────────────── */}
      <Reveal>
        <div className="flex flex-col items-center gap-12 md:flex-row md:items-center md:gap-16">
          <OrbitCluster links={LINKS} photoAlt={`${SITE_NAME}, portrait`} />

          <div className="max-w-xl text-center md:text-left">
            <p className="mono-label">About</p>
            <h1 className="mt-4 font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Andrew
              <br />
              Coggins
            </h1>
            <p className="mt-5 font-mono text-sm text-muted">
              Computer &amp; Electrical Engineering — Texas A&amp;M &rsquo;28
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── who I am ───────────────────────────────────── */}
      <Reveal delay={0.1}>
        <p className="mt-20 max-w-3xl font-heading text-2xl font-medium leading-snug sm:text-3xl">
          I work at both ends of the stack — RFID timing hardware on one side,
          agentic AI systems on the other. Most of what I build is something I
          needed and couldn&rsquo;t buy: a race-timing rig to replace a
          $3,000-a-year vendor, a scheduler that ranks all 21,643 course
          sections instead of guessing. I care about the part where it actually
          ships and someone uses it.
        </p>
      </Reveal>

      {/* ── right now ──────────────────────────────────── */}
      <Reveal delay={0.15}>
        <div className="mt-16 border-l-2 border-copper pl-6">
          <p className="mono-label text-copper">Right now</p>
          <p className="mt-3 max-w-2xl font-heading text-xl leading-snug sm:text-2xl">
            Summer 2026 — studying computer architecture at Queen&rsquo;s
            University Belfast, including work with AMD Ireland.
          </p>
        </div>
      </Reveal>

      {/* ── hardware × software ────────────────────────── */}
      <Reveal delay={0.1} className="mt-20">
        <StackSplit />
      </Reveal>

      {/* ── one quiet line out ─────────────────────────── */}
      <Reveal delay={0.1}>
        <div className="mt-20 border-t border-line pt-8">
          <p className="font-heading text-xl">Let&rsquo;s build something real.</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
            <a
              href={`mailto:${EMAIL}`}
              className="font-mono text-sm text-copper transition-colors hover:text-copper-bright"
            >
              {EMAIL}
            </a>
            <a
              href={RESUME_PATH}
              download
              className="mono-label transition-colors hover:text-fg"
            >
              Résumé ↓
            </a>
            <Link href="/#work" className="mono-label transition-colors hover:text-fg">
              See the work →
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
