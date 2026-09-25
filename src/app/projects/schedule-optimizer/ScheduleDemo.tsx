"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { DEFAULT_PREFS } from "@/lib/demo/schedule/types";
import type { Prefs, ScheduleResult, Section, SectionScore } from "@/lib/demo/schedule/types";
import { rankSchedules } from "@/lib/demo/schedule/engine";
import { DEMO_DATA } from "@/lib/demo/schedule/fixtures";

/* ────────────────────────── helpers ────────────────────────── */

const HOURS = Array.from({ length: 14 }, (_, i) => `${String(7 + i).padStart(2, "0")}:00`);

const DAYS: { key: string; label: string; full: string }[] = [
  { key: "M", label: "M", full: "Monday" },
  { key: "T", label: "T", full: "Tuesday" },
  { key: "W", label: "W", full: "Wednesday" },
  { key: "R", label: "R", full: "Thursday" },
  { key: "F", label: "F", full: "Friday" },
];

type ComponentKey = keyof SectionScore["components"];

const COMPONENT_LABELS: Record<ComponentKey, string> = {
  prof_rating: "Prof",
  gpa: "GPA",
  time_fit: "Time",
};

function scheduleKey(result: ScheduleResult): string {
  return result.sections
    .map((s) => s.crn)
    .sort()
    .join("-");
}

function meetingsSummary(section: Section): string {
  if (section.meetings.length === 0) return "Online / async";
  return section.meetings
    .map((m) => `${m.days} ${m.start}–${m.end}${m.location ? ` · ${m.location}` : ""}`)
    .join(" · ");
}

/** Schedule-level average of a per-section component; null if no section has data. */
function avgComponent(scores: SectionScore[], key: ComponentKey): number | null {
  const vals = scores
    .map((s) => s.components[key])
    .filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function pct(v: number): number {
  return Math.round(Math.max(0, Math.min(1, v)) * 100);
}

/* ────────────────────── small presentational bits ────────────────────── */

function ComponentBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      {value === null ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted/60">
          no data
        </span>
      ) : (
        <>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-raised">
            <div
              className="h-full rounded-full bg-copper transition-[width] duration-300"
              style={{ width: `${pct(value)}%` }}
            />
          </div>
          <span className="w-7 shrink-0 text-right font-mono text-[10px] text-muted">
            {pct(value)}
          </span>
        </>
      )}
    </div>
  );
}

function WeightSlider({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number; // 0-100
  onChange: (pct: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="mono-label">
          {label}
        </label>
        <span className="font-mono text-sm text-copper">{value}%</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-valuetext={`${value}%`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-auto accent-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      />
    </div>
  );
}

function TimeSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mono-label block">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-md border border-line bg-raised px-3 py-2 font-mono text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ────────────────────────── ranked card ────────────────────────── */

function ScheduleCard({
  result,
  rank,
  expanded,
  onToggle,
  animateLayout,
}: {
  result: ScheduleResult;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
  animateLayout: boolean;
}) {
  const detailId = useId();
  const componentAverages = (Object.keys(COMPONENT_LABELS) as ComponentKey[]).map((key) => ({
    key,
    label: COMPONENT_LABELS[key],
    value: avgComponent(result.sectionScores, key),
  }));

  return (
    <motion.li
      layout={animateLayout}
      initial={animateLayout ? { opacity: 0, scale: 0.98 } : false}
      animate={{ opacity: 1, scale: 1 }}
      exit={animateLayout ? { opacity: 0, scale: 0.98 } : undefined}
      transition={{ layout: { duration: 0.45, ease: [0.21, 0.6, 0.35, 1] }, duration: 0.25 }}
      className="rounded-xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex items-start gap-4 sm:gap-5">
        <p
          aria-hidden="true"
          className={`font-heading text-4xl font-bold leading-none sm:text-5xl ${
            rank === 1 ? "text-copper-bright" : "text-muted/40"
          }`}
        >
          {rank}
        </p>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="mono-label">
              <span className="sr-only">Rank {rank}, </span>
              {result.sections.length} sections · CRNs{" "}
              {result.sections.map((s) => s.crn).join(", ")}
            </p>
            <p className="font-heading text-2xl font-bold text-copper">
              {pct(result.total)}
              <span className="text-base">%</span>
            </p>
          </div>

          <ul className="mt-3 space-y-2">
            {result.sections.map((s) => (
              <li key={s.crn} className="text-sm">
                <span className="font-medium text-fg">
                  {s.course}-{s.section}
                </span>{" "}
                <span className="text-muted">· {s.instructor}</span>
                <span className="block font-mono text-xs text-muted">{meetingsSummary(s)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid gap-1.5 sm:max-w-sm">
            {componentAverages.map((c) => (
              <ComponentBar key={c.key} label={c.label} value={c.value} />
            ))}
          </div>

          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={onToggle}
            className="mt-4 rounded-md font-mono text-xs uppercase tracking-[0.14em] text-copper transition-colors hover:text-copper-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {expanded ? "− Hide section scores" : "+ Section scores"}
          </button>

          {expanded && (
            <div id={detailId} className="mt-4 space-y-4 border-t border-line pt-4">
              {result.sections.map((s, i) => {
                const score = result.sectionScores[i];
                return (
                  <div key={s.crn}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className="font-mono text-xs text-fg">
                        {s.course}-{s.section} · {s.instructor}
                      </p>
                      {score && (
                        <p className="font-mono text-xs text-copper">{pct(score.total)}%</p>
                      )}
                    </div>
                    {score && (
                      <div className="mt-2 grid gap-1.5 sm:max-w-sm">
                        {(Object.keys(COMPONENT_LABELS) as ComponentKey[]).map((key) => (
                          <ComponentBar
                            key={key}
                            label={COMPONENT_LABELS[key]}
                            value={score.components[key]}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.keys(result.schedule_factors).length > 0 && (
                <div>
                  <p className="mono-label">Schedule factors</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(result.schedule_factors).map(([name, v]) => (
                      <span
                        key={name}
                        className="rounded-md border border-line bg-raised px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
                      >
                        {name.replace(/_/g, " ")}{" "}
                        <span className="text-copper">
                          {v >= 0 && v <= 1 ? `${pct(v)}%` : v.toFixed(2)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}

/* ────────────────────────── main component ────────────────────────── */

export default function ScheduleDemo() {
  const reduced = useReducedMotion();
  const animateLayout = !reduced;
  const uid = useId();

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // ~≤27 combos with the fixture data — ranking is instant, run synchronously.
  const allResults = useMemo(() => rankSchedules(DEMO_DATA, prefs), [prefs]);
  const top = allResults.slice(0, 5);

  const setWeight = (key: keyof Prefs["weights"]) => (p: number) =>
    setPrefs((prev) => ({ ...prev, weights: { ...prev.weights, [key]: p / 100 } }));

  const setTime = (key: "earliest" | "latest") => (v: string) =>
    setPrefs((prev) => ({ ...prev, time: { ...prev.time, [key]: v } }));

  const toggleDay = (d: string) =>
    setPrefs((prev) => {
      const has = prev.time.days_off.includes(d);
      return {
        ...prev,
        time: {
          ...prev.time,
          days_off: has
            ? prev.time.days_off.filter((x) => x !== d)
            : [...prev.time.days_off, d],
        },
      };
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* ── Controls ── */}
      <div className="h-fit rounded-xl border border-line bg-surface p-6 lg:sticky lg:top-24">
        <p className="mono-label text-copper">Weights</p>
        <div className="mt-4 space-y-5">
          <WeightSlider
            id={`${uid}-w-prof`}
            label="Professor rating"
            value={Math.round(prefs.weights.prof_rating * 100)}
            onChange={setWeight("prof_rating")}
          />
          <WeightSlider
            id={`${uid}-w-gpa`}
            label="GPA history"
            value={Math.round(prefs.weights.gpa * 100)}
            onChange={setWeight("gpa")}
          />
          <WeightSlider
            id={`${uid}-w-time`}
            label="Time fit"
            value={Math.round(prefs.weights.time_fit * 100)}
            onChange={setWeight("time_fit")}
          />
        </div>

        <p className="mono-label mt-8 text-copper">Time window</p>
        <div className="mt-4 flex gap-3">
          <TimeSelect
            id={`${uid}-t-earliest`}
            label="Earliest"
            value={prefs.time.earliest}
            onChange={setTime("earliest")}
          />
          <TimeSelect
            id={`${uid}-t-latest`}
            label="Latest"
            value={prefs.time.latest}
            onChange={setTime("latest")}
          />
        </div>

        <p className="mono-label mt-8 text-copper" id={`${uid}-daysoff-label`}>
          Days off
        </p>
        <div
          role="group"
          aria-labelledby={`${uid}-daysoff-label`}
          className="mt-4 flex gap-2"
        >
          {DAYS.map((d) => {
            const active = prefs.time.days_off.includes(d.key);
            return (
              <button
                key={d.key}
                type="button"
                aria-pressed={active}
                aria-label={`${d.full} off`}
                onClick={() => toggleDay(d.key)}
                className={`h-10 w-10 rounded-md border font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  active
                    ? "border-copper/60 bg-copper/15 text-copper"
                    : "border-line bg-raised text-muted hover:text-fg"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <p className="mt-8 border-t border-line pt-5 font-mono text-xs leading-relaxed text-muted">
          Sample course data, scored in your browser. These are not current course listings or live seat counts.
        </p>
      </div>

      {/* ── Ranked list ── */}
      <div className="min-w-0">
        <p className="mono-label mb-4" aria-live="polite">
          Top {top.length} of {allResults.length} conflict-free schedules ·{" "}
          {DEMO_DATA.term}
        </p>
        {top.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-8">
            <p className="font-heading text-lg font-bold text-fg">
              No conflict-free schedule fits these preferences.
            </p>
            <p className="mt-2 text-sm text-muted">
              Loosen the time window or free up fewer days and the ranking will come back.
            </p>
          </div>
        ) : (
          <LayoutGroup>
            <ul className="space-y-4">
              <AnimatePresence initial={false}>
                {top.map((result, i) => {
                  const key = scheduleKey(result);
                  return (
                    <ScheduleCard
                      key={key}
                      result={result}
                      rank={i + 1}
                      expanded={expandedKey === key}
                      onToggle={() =>
                        setExpandedKey((prev) => (prev === key ? null : key))
                      }
                      animateLayout={animateLayout}
                    />
                  );
                })}
              </AnimatePresence>
            </ul>
          </LayoutGroup>
        )}
      </div>
    </div>
  );
}
