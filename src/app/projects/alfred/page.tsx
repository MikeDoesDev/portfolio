import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import MediaFrame from "@/components/project/MediaFrame";
import Reveal from "@/components/motion/Reveal";
import { getProject } from "@/content/projects";
import ArchitectureDiagram from "./ArchitectureDiagram";

export const metadata: Metadata = {
  title: "ALFRED",
  description:
    "Case study: a personal AI command center — calendar, email, habits, Obsidian notes, and a streaming Claude chat unified in one dark dashboard.",
};

export default function AlfredPage() {
  return (
    <ProjectLayout
      project={getProject("alfred")}
      role="I designed and built ALFRED solo, as my daily-driver command center — the one dark screen I open in the morning to run the day instead of bouncing between a calendar tab, an inbox tab, a habit app, and a chat window."
    >
      {/* Overview */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">01 · Overview</p>
          <h2 className="font-heading text-3xl font-bold">One screen that runs the day</h2>
          <div className="mt-6 max-w-2xl space-y-4 text-muted">
            <p>
              ALFRED is a Jarvis-style dashboard: a header, a HUD bar, a main tab panel, and a
              persistent chat panel. Five tabs cover the surfaces I actually use — Schedule
              (Google Calendar), Email (Gmail inbox), Habits, ALFRED (Claude chat), and Brain
              (my Obsidian vault notes). A Daily Bulletin ticker runs across the top with the
              day&apos;s goal and recommended reading pulled from Hacker News, Scientific
              American, CNBC, The Verge, and TechCrunch.
            </p>
            <p>
              It&apos;s built on Next.js 16, TypeScript, Tailwind, and shadcn/ui. The chat is
              the Claude API streaming through a <code className="font-mono text-sm text-fg">/api/chat</code>{" "}
              route with my personal context injected — so ALFRED answers like an assistant
              that already knows my goals, not a blank chatbot. Calendar is read/write over
              OAuth; Gmail is read-only with full message-body decoding.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Architecture diagram */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">02 · Architecture</p>
          <MediaFrame caption="System architecture — browser UI, Next.js API routes, and the three external services behind them.">
            <ArchitectureDiagram />
          </MediaFrame>
        </section>
      </Reveal>

      {/* Highlights */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">03 · Highlights</p>
          <h2 className="font-heading text-3xl font-bold">What makes it work</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-bold text-fg">Context-aware streaming chat</h3>
              <p className="mt-3 text-sm text-muted">
                Every message goes through <span className="font-mono">/api/chat</span> with my
                personal context injected before it reaches Claude, and the response streams
                token-by-token into the chat panel. Asking ALFRED something feels like asking
                someone who was already in the room.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-bold text-fg">Calendar and inbox, one surface</h3>
              <p className="mt-3 text-sm text-muted">
                Google Calendar over OAuth with full read/write, and a Gmail inbox that decodes
                full message bodies — read-only by design. The day&apos;s schedule and mail live
                next to the chat instead of two browser tabs away.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-bold text-fg">Four Wins habit framework</h3>
              <p className="mt-3 text-sm text-muted">
                The Habits tab tracks four life categories — Physical, Mental, Spiritual, Rest.
                Win all four and the day is a win, whatever else happened. The Daily Bulletin
                ticker keeps the day&apos;s goal in view the whole time.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Metrics */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">04 · By the numbers</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-8">
              <p className="font-heading text-5xl font-bold text-copper-bright">53/53</p>
              <p className="mono-label mt-3">Playwright tests passing</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-8">
              <p className="font-heading text-5xl font-bold text-copper-bright">5</p>
              <p className="mono-label mt-3">Integrated surfaces</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-8">
              <p className="font-heading text-5xl font-bold text-copper-bright">3</p>
              <p className="mono-label mt-3">External APIs</p>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-sm text-muted">
            QA&apos;d end-to-end with Playwright: 53 of 53 tests passing and zero console errors
            across the full run.
          </p>
        </section>
      </Reveal>

      {/* What's next */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">05 · What&apos;s next</p>
          <div className="max-w-2xl space-y-4 text-muted">
            <p>
              ALFRED is about 90% built and runs on localhost today. Next up: moving habit
              persistence from localStorage to Supabase, and giving the chat tool-use — so
              telling ALFRED &ldquo;book an hour Thursday morning&rdquo; creates the calendar
              event instead of just describing it.
            </p>
          </div>
        </section>
      </Reveal>
    </ProjectLayout>
  );
}
