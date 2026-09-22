import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import EmbedFrame from "@/components/project/EmbedFrame";
import Reveal from "@/components/motion/Reveal";
import { getProject } from "@/content/projects";

export const metadata: Metadata = {
  title: "WIT — The Life Game",
  description:
    "Whatever It Takes: a habit tracker that plays like a game — four Wins, six ranks, streak shields, and a 12-week consistency heatmap, validated by 53 passing self-tests.",
};

const metrics = [
  { value: "53/53", label: "self-tests passing on the pure-logic core" },
  { value: "6", label: "ranks — Recruit to Legend" },
  { value: "12-week", label: "consistency heatmap with goal-rule overlay" },
  { value: "4", label: "Wins — Physical, Mental, Spiritual, Rest" },
];

export default function WitPage() {
  return (
    <ProjectLayout
      project={getProject("wit")}
      role="I designed the game system from first principles — the Wins, the XP economy, the streak rules — and shipped the working prototype that runs it end to end."
    >
      <Reveal>
        <section className="max-w-2xl">
          <h2 className="mono-label mb-4 text-copper">Overview</h2>
          <div className="space-y-4 text-muted">
            <p>
              WIT — &ldquo;Whatever It Takes&rdquo; — is a habit tracker that plays like a game,
              built to make personal consistency non-negotiable. Days are scored across
              four Wins: Physical, Mental, Spiritual, and Rest. Twelve schedule-aware
              habits feed those scores — some daily, some a set number of times per week,
              some tied to weekday patterns — so the game knows the difference between a
              skipped workout and a rest day.
            </p>
            <p>
              Consistency earns XP across six ranks, from Recruit through Grinder,
              Consistent, and Locked In, up to WIT and Legend. Streak shields — earned,
              and deliberately capped — absorb the occasional miss. Daily scores roll into
              a 7-day average with 14, 30, and 90-day windows, and a 12-week heatmap with
              a goal-rule overlay shows the shape of your consistency at a glance. An
              if-then cue UI plans the habit before the moment arrives, and an animated
              constellation canvas gives the whole thing a hero screen worth opening.
            </p>
            <p className="text-fg">
              It&rsquo;s plain HTML, CSS, and JavaScript with localStorage — no build step, on
              purpose. The game logic lives in a pure-logic core, wit-core.js, validated
              by 53 passing self-tests, and the app ships seeded with about 12 weeks of
              mock history so it&rsquo;s alive the moment you open it.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          {/* This used to be an empty placeholder frame sitting directly above a
              link to the working demo. The demo is the proof, so it runs here. */}
          <EmbedFrame src="/demos/wit/index.html" title="WIT, the life game" aspect={16 / 10} />
          <p className="text-center font-mono text-xs text-muted">
            It&rsquo;s a living prototype. Play a day, or open it full screen below.
          </p>
          <div className="flex justify-center">
            <a
              href="/demos/wit/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-lg bg-copper px-8 py-4 font-heading text-lg font-semibold text-ink transition-colors hover:bg-copper-bright"
            >
              Launch the demo ↗
            </a>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section>
          <h2 className="mono-label mb-6 text-copper">Highlights</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-semibold">Schedule-aware streak engine</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Naive streak counters punish you for not doing a three-times-a-week habit
                on a Tuesday. WIT&rsquo;s engine evaluates each habit against its own schedule —
                daily, per-week quotas, weekday patterns — so a streak only breaks when
                you actually broke your word. Streak shields sit on top: earned through
                consistency, capped so they stay a safety net instead of a loophole.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-semibold">Rank economy</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                XP curves are motivation design. Early ranks — Recruit, Grinder — come
                fast, because a new system has to pay out before the habit exists. The
                climb through Consistent and Locked In stretches out, and WIT and Legend
                are priced so they can only be bought with months of showing up. The rank
                names are the point: each one describes the person, not the number.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-semibold">Prototype-first discipline</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                No framework, no build step, no backend — deliberately. The bet that
                matters is whether the core loop keeps a person coming back, and plain
                JS + localStorage tests that bet at zero infrastructure cost. The
                pure-logic core is validated by 53/53 self-tests, so when it graduates to
                React Native and Supabase, the game rules move over proven.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="border-y border-line py-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
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
            The prototype exists to be graduated from. Next is the production build —
            React Native for a phone-native daily loop and Supabase for sync — carrying
            over the tested wit-core rules rather than rewriting them. Before that, more
            days played: the whole point of prototype-first is letting real use, not a
            roadmap, decide which mechanics earn a place in the app.
          </p>
        </section>
      </Reveal>
    </ProjectLayout>
  );
}
