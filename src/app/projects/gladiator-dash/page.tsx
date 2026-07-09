import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import MediaFrame from "@/components/project/MediaFrame";
import Reveal from "@/components/motion/Reveal";
import { getProject } from "@/content/projects";
import TimingDiagram from "./TimingDiagram";

export const metadata: Metadata = {
  title: "Gladiator Dash RFID Timing",
  description:
    "Architecting an RFID race-timing pod — industrial reader, tuned antennas, Raspberry Pi pipeline — to replace a $3K/year timing vendor at Texas A&M's Gladiator Dash mud run.",
};

const metrics = [
  { value: "~$1.2K", label: "one-time hardware vs $3K/yr vendor" },
  { value: "2", label: "antenna read zones — start + finish" },
  { value: "100s", label: "of runners timed per heat" },
];

export default function GladiatorDashPage() {
  return (
    <ProjectLayout
      project={getProject("gladiator-dash")}
      role="I'm the sole architect on this system: I own the requirements, the hardware evaluation, the RF failure-mode analysis, and the design of the data pipeline from tag read to leaderboard."
    >
      <Reveal>
        <section className="max-w-2xl">
          <h2 className="mono-label mb-4 text-copper">Overview</h2>
          <div className="space-y-4 text-muted">
            <p>
              Every year, Texas A&amp;M&rsquo;s Gladiator Dash mud run pays a vendor roughly
              $3,000 to time the race. I&rsquo;m architecting the replacement: a single arena
              pod built from one industrial RFID reader — I&rsquo;m evaluating the Impinj
              Speedway R420 against budget Chafon units — feeding two circular-polarized
              antennas that form read zones at the start and finish lines, about 25 feet
              apart.
            </p>
            <p>
              A Raspberry Pi 4 running Python drives the reader, writes every tag read to
              SQLite, and serves a live FastAPI + HTMX leaderboard on site, with
              store-and-forward backup to the cloud. After the race, the same data set
              produces splits by age, gender, and heat.
            </p>
            <p className="text-fg">
              This is engineering in public: the project is in its architecture and
              feasibility phase. The hardware comparison and cost-benefit analysis are
              done; procurement is next. What follows is system design work, not shipped
              code — and I&rsquo;d rather show the design thinking honestly than dress it up.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <MediaFrame caption="How a lap becomes a leaderboard row: the runner trips the start and finish read zones, and each read event flows through time-gating into SQLite and out to the live leaderboard.">
          <TimingDiagram />
        </MediaFrame>
      </Reveal>

      <Reveal>
        <section>
          <h2 className="mono-label mb-6 text-copper">Highlights</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-semibold">Cross-read mitigation</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                The core engineering problem: with two antennas 25 feet apart, a tag can
                be read by the wrong one — a runner near the start line pinging the finish
                antenna corrupts both times. I attack it four ways: physical antenna aim,
                TX power tuning to shrink each read zone, time-gating logic that rejects
                physically impossible reads, and a &ldquo;first read = start&rdquo; heuristic so an
                early stray read can&rsquo;t assign a runner a finish before they&rsquo;ve started.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-semibold">Store-and-forward reliability</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Race day happens in a muddy field with no reliable connectivity, so the
                design trusts nothing off the pod. SQLite on the Pi is the source of
                truth; every read is committed locally first, the leaderboard is served
                from the same box, and results sync to the cloud opportunistically. If the
                uplink dies mid-heat, nobody loses a time.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-semibold">Build vs rent economics</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                The bill of materials targets $1,115–$1,315 all-in, against $3,000 per
                year for the vendor — the pod pays for itself before the first starting
                gun and saves every year after. The reader is the swing item, which is why
                the Impinj-vs-Chafon evaluation matters: it&rsquo;s most of the budget and most
                of the read-rate risk.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="border-y border-line py-10">
          <div className="grid gap-10 sm:grid-cols-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="font-heading text-4xl font-bold text-copper sm:text-5xl">{m.value}</p>
                <p className="mono-label mt-3">{m.label}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="max-w-2xl">
          <h2 className="mono-label mb-4 text-copper">What&rsquo;s next</h2>
          <p className="text-muted">
            Procurement. With the architecture and cost-benefit settled, the next step is
            buying the reader and antennas and moving from analysis to bench testing:
            measuring real cross-read rates at race spacing, tuning TX power against
            actual tags, and validating the time-gating thresholds with data instead of
            assumptions. Then a live pilot heat before it times the real thing.
          </p>
        </section>
      </Reveal>
    </ProjectLayout>
  );
}
