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
  title: "About",
  description:
    "Andrew “Michael” Coggins. Computer and Electrical Engineering at Texas A&M, building things that make life easier and faster.",
};

/* ────────────────────────────────────────────────────────────────
   COPY
   Every word on this page lives here. Edit the strings, nothing else.
   House rule: avoid em dashes in prose. Fine in a range like "2026 — present".
   Anything marked NEEDS is a placeholder until Michael sends the real thing.
   ──────────────────────────────────────────────────────────────── */

const COPY = {
  eyebrow: "About",
  name: "Hi I’m Andrew “Michael” Coggins",
  school: "Computer & Electrical Engineering, Texas A&M ’28",

  opener:
    "I build things that make life easier and faster. Most of them are things I needed and couldn’t buy: a scheduler that ranks every possible schedule instead of guessing, a timing system for my organization’s charity race. I care about the part where it actually ships and someone uses it.",

  nowLabel: "Right now",
  now: "Studying computer architecture at Queen’s University Belfast, including work with AMD Ireland.",

  originLabel: "Where this started",
  origin: [
    "I’ve been around computers my whole life. Robotics in intermediate school and junior high, building LEGO motors and vehicle parts that would only move once the code ran. That’s hardware and software in the same hand, at about eleven years old, and I never really stopped.",
    "The rest I learned next to my dad: oil filters, the electronics around the house, batteries in cars and jetskis. Then my own PC in high school, putting RAM in it and working out why it wouldn’t boot after I’d been working on it.",
    "I kept going because I liked seeing things work. I’m obsessed with efficiency and making things as simple as possible, and not just in engineering. The route to a friend’s house counts. I want things to work well, fast, and get finished like they were cared about.",
  ],

  serviceLabel: "One Army and Still Creek Ranch",
  service: [
    "I’m a Class Candidate Advisor in One Army, Texas Aggie Men United, one of eight leaders who onboard and mentor new members across an organization of 90+. I joined because it let me get involved with A&M while building myself through service, leadership and brotherhood.",
    "Our philanthropy is Still Creek Ranch. Since 1988 they’ve taken in boys and girls out of abuse, neglect, abandonment and trafficking, and placed them in family-style homes. I’m at the ranch most Fridays, hanging out with the boys there. Basketball, volleyball, football, cards, and conversations that actually go somewhere.",
    "Gladiator Dash is how we fund it. 2,380 people ran it in 2026 and we raised a record $185,000. It’s also why I started designing an RFID timing system: owning the timing saves money, gives runners real information, and makes the race legitimate enough for serious competitors to show up.",
  ],

  stackLabel: "Both ends of the stack",
  stackNote:
    "It was never a strategy. It’s the LEGO motors again, with better tools.",

  beyondLabel: "Off the clock",
  coachingTitle: "Coaching tennis",
  coachingNote: "Built my own practice from zero to 20+ students since 2024.",
  bajaTitle: "Baja SAE",
  bajaNote: "Business lead. Sponsors, recruitment and operations.",
  ranchTitle: "Fridays at the ranch",
  ranchNote: "Still Creek. Basketball and card games.",

  currentlyLabel: "Currently",
  readingTitle: "Reading",
  reading: ["Dune Messiah", "The Bible", "Harry Potter"],
  watchingTitle: "Watching",
  watchingNote: "NEEDS: Letterboxd link, the feed can update itself",
  followingTitle: "Following",
  followingNote: "NEEDS: which teams",

  travelLabel: "Been there",
  travel: [
    "Ireland",
    "Northern Ireland",
    "Scotland",
    "France",
    "Spain",
    "Italy",
    "Canada",
    "Cancún",
  ],
  travelNote: "Most recently Queen’s University Belfast and AMD in Dublin, summer 2026.",

  closer: "Let’s build something real.",
  seeWork: "See the work",
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

function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="mt-5 max-w-2xl space-y-4 text-muted">
      {paragraphs.map((p) => (
        <p key={p.slice(0, 28)}>{p}</p>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mono-label text-copper">{children}</p>;
}

function MiniCard({ title, note }: { title: string; note: string }) {
  const pending = note.startsWith("NEEDS");
  return (
    <li className="border-b border-line py-3 last:border-b-0">
      <p className="font-medium">{title}</p>
      <p className={`mt-0.5 text-sm ${pending ? "text-muted/60 italic" : "text-muted"}`}>
        {note}
      </p>
    </li>
  );
}

/** Same row shape as MiniCard, but for a title with several entries under it. */
function StackCard({ title, items }: { title: string; items: string[] }) {
  return (
    <li className="border-b border-line py-3 last:border-b-0">
      <p className="font-medium">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-muted">
            {item}
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
      {/* portrait + orbit */}
      <Reveal>
        <div className="flex flex-col items-center gap-12 md:flex-row md:items-center md:gap-16">
          <OrbitCluster links={LINKS} photoAlt={`${SITE_NAME}, portrait`} />

          <div className="max-w-xl text-center md:text-left">
            <SectionLabel>{COPY.eyebrow}</SectionLabel>
            <h1 className="mt-4 font-heading text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              {COPY.name}
            </h1>
            <p className="mt-5 font-mono text-sm text-muted">{COPY.school}</p>
          </div>
        </div>
      </Reveal>

      {/* the opener */}
      <Reveal delay={0.1}>
        <p className="mt-20 max-w-3xl font-heading text-2xl font-medium leading-snug sm:text-3xl">
          {COPY.opener}
        </p>
      </Reveal>

      {/* right now */}
      <Reveal delay={0.15}>
        <div className="mt-16 border-l-2 border-copper pl-6">
          <SectionLabel>{COPY.nowLabel}</SectionLabel>
          <p className="mt-3 max-w-2xl font-heading text-xl leading-snug sm:text-2xl">
            {COPY.now}
          </p>
        </div>
      </Reveal>

      {/* where this started */}
      <Reveal delay={0.1}>
        <section className="mt-20">
          <SectionLabel>{COPY.originLabel}</SectionLabel>
          <Prose paragraphs={COPY.origin} />
        </section>
      </Reveal>

      {/* one army */}
      <Reveal delay={0.1}>
        <section className="mt-20">
          <SectionLabel>{COPY.serviceLabel}</SectionLabel>
          <Prose paragraphs={COPY.service} />
        </section>
      </Reveal>

      {/* hardware x software */}
      <Reveal delay={0.1}>
        <section className="mt-20">
          <SectionLabel>{COPY.stackLabel}</SectionLabel>
          <p className="mt-3 max-w-2xl text-muted">{COPY.stackNote}</p>
          <div className="mt-10">
            <StackSplit />
          </div>
        </section>
      </Reveal>

      {/* off the clock + currently + travel */}
      <Reveal delay={0.1}>
        <section className="mt-20 grid gap-10 sm:grid-cols-3">
          <div>
            <SectionLabel>{COPY.beyondLabel}</SectionLabel>
            <ul className="mt-5">
              <MiniCard title={COPY.coachingTitle} note={COPY.coachingNote} />
              <MiniCard title={COPY.bajaTitle} note={COPY.bajaNote} />
              <MiniCard title={COPY.ranchTitle} note={COPY.ranchNote} />
            </ul>
          </div>

          <div>
            <SectionLabel>{COPY.currentlyLabel}</SectionLabel>
            <ul className="mt-5">
              <StackCard title={COPY.readingTitle} items={COPY.reading} />
              <MiniCard title={COPY.watchingTitle} note={COPY.watchingNote} />
              <MiniCard title={COPY.followingTitle} note={COPY.followingNote} />
            </ul>
          </div>

          <div>
            <SectionLabel>{COPY.travelLabel}</SectionLabel>
            <ul className="mt-5 flex flex-wrap gap-2">
              {COPY.travel.map((place) => (
                <li
                  key={place}
                  className="rounded-md bg-raised px-2.5 py-1 font-mono text-xs text-fg"
                >
                  {place}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">{COPY.travelNote}</p>
          </div>
        </section>
      </Reveal>

      {/* closer */}
      <Reveal delay={0.1}>
        <div className="mt-20 border-t border-line pt-8">
          <p className="font-heading text-xl">{COPY.closer}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
            <a
              href={`mailto:${EMAIL}`}
              className="font-mono text-sm text-copper transition-colors hover:text-copper-bright"
            >
              {EMAIL}
            </a>
            <a href={RESUME_PATH} download className="mono-label transition-colors hover:text-fg">
              Résumé ↓
            </a>
            <Link href="/#work" className="mono-label transition-colors hover:text-fg">
              {COPY.seeWork} →
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
