import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import MediaFrame from "@/components/project/MediaFrame";
import Reveal from "@/components/motion/Reveal";
import { getProject } from "@/content/projects";
import PipelineDiagram from "./PipelineDiagram";
import ScheduleDemo from "./ScheduleDemo";

export const metadata: Metadata = {
  title: "TAMU Schedule Optimizer",
  description:
    "Case study: a pipeline that ingests ~21.7k TAMU course sections, enriches them with professor ratings and real grade distributions, and scores every conflict-free schedule against personal weights.",
};

export default function ScheduleOptimizerPage() {
  return (
    <ProjectLayout
      project={getProject("schedule-optimizer")}
      role="I designed and built this solo — the fetchers, the scoring engine, and the UI — to turn class registration from a gamble into a computed decision."
    >
      {/* Overview */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">01 — Overview</p>
          <h2 className="font-heading text-3xl font-bold">
            Registration is a gamble. This computes the answer.
          </h2>
          <div className="mt-6 max-w-2xl space-y-4 text-muted">
            <p>
              Every semester at Texas A&amp;M, you pick sections half-blind: is this professor
              good, what do their grade distributions actually look like, and does this
              combination even fit together? I stopped guessing and built a pipeline that
              answers it.
            </p>
            <p>
              It pulls the full TAMU catalog — roughly 21,700 sections across every major —
              from the public feed, then overlays my candidate sections from Aggie Schedule
              Builder to add real seat counts. Each professor gets enriched with
              RateMyProfessors ratings (via their GraphQL API) and anex.us grade
              distributions. The engine then generates every conflict-free schedule
              combination, scores each one against my personal weights — professor quality,
              GPA history, preferred times — and hands back the winning schedule&apos;s CRNs
              to pin in Aggie Schedule Builder.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Pipeline diagram */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">02 — Pipeline</p>
          <MediaFrame caption="Data pipeline — two section sources merged by CRN, enriched from two rating sources, scored by a pure engine, ranked in the UI, CRNs returned to registration.">
            <PipelineDiagram />
          </MediaFrame>
        </section>
      </Reveal>

      {/* Highlights */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">03 — Highlights</p>
          <h2 className="font-heading text-3xl font-bold">The parts I&apos;m proud of</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-bold text-fg">A pure, testable engine</h3>
              <p className="mt-3 text-sm text-muted">
                Name matching, conflict detection, combo generation, and scoring are pure
                functions — no I/O, no network. The whole test suite runs fully offline
                against recorded fixtures, so the scoring logic is verifiable without
                touching a single live endpoint.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-bold text-fg">Honest about fuzzy data</h3>
              <p className="mt-3 text-sm text-muted">
                &ldquo;SMITH J&rdquo; and &ldquo;John Smith&rdquo; are the same person — but the
                pipeline never just assumes it. Fuzzy name matches carry a confidence score,
                and anything below 0.8 is surfaced as a warning in the UI rather than
                trusted silently.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-bold text-fg">Missing data can&apos;t cheat</h3>
              <p className="mt-3 text-sm text-muted">
                Unknown or TBA professors score a neutral 0.5, so a data gap never outranks a
                known-good professor — and never buries a section unfairly either. A section
                missing one component still scores sensibly on the rest instead of collapsing
                to zero.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Metrics */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">04 — By the numbers</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-8">
              <p className="font-heading text-5xl font-bold text-copper-bright">21.7k</p>
              <p className="mono-label mt-3">Catalog sections ingested per term</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-8">
              <p className="font-heading text-5xl font-bold text-copper-bright">0.8</p>
              <p className="mono-label mt-3">Name-match confidence gate</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-8">
              <p className="font-heading text-5xl font-bold text-copper-bright">Top 50</p>
              <p className="mono-label mt-3">Ranked schedules per query</p>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-sm text-muted">
            Every conflict-free combination — one section per course — is generated and
            scored; the UI renders the winners on a calendar grid with per-section ratings,
            GPA history, and live seat counts.
          </p>
        </section>
      </Reveal>

      {/* Live demo */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">Live demo</p>
          <h2 className="font-heading text-3xl font-bold">
            Drag the weights. Watch the ranking move.
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            A slice of the scoring engine, ported to run in your browser against real
            fixture data — re-ranking every conflict-free schedule as you adjust the
            sliders.
          </p>
          <div className="mt-8">
            <ScheduleDemo />
          </div>
        </section>
      </Reveal>

      {/* What's next */}
      <Reveal>
        <section>
          <p className="mono-label mb-4 text-copper">05 — What&apos;s next</p>
          <div className="max-w-2xl space-y-4 text-muted">
            <p>
              The tool already runs my real registrations end-to-end from a Flask server on
              port 5350. The next step is that in-browser demo above — the same pure scoring
              functions, re-ranking live as you drag the weight sliders, so you can feel how
              &ldquo;professor quality vs. GPA history vs. mornings off&rdquo; changes the
              winning schedule.
            </p>
          </div>
        </section>
      </Reveal>
    </ProjectLayout>
  );
}
